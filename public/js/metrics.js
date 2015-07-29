var socket;
var salt;
var host;
var loggedIn = false;
if (!window.console) console = { log: function () { } };

window.onload = function () {
    $('#alertAuthError').hide();
    location.hash = "";
    host = "http://" + window.location.hostname + ":" + socketPort;
    sessionStorage.setItem("courseCode", room.toUpperCase());
    setupEvents();
    
    socket = io.connect(host);
    socket.on('connectionSuccess', function (data) {
        salt = data.salt;
        console.log("Connected to server");
    });
    
    socket.on('authCompleteMetrics', onAuthCompleteMetrics);
    socket.on('pushedMetrics', onPushedMetrics);
}

$(document).ready(function () {
    $("#password").keyup(function (e) {
        if (e.keyCode == 13) {
            submitAuth();
        }
    });
});

function setupEvents() {
    $("#btnLogin").off().click(submitAuth);
    $("#password").focus();
    $("#password").select();
}

function submitAuth() {
    sessionStorage.setItem("passwordMD5", hex_md5($("#password").val()));
    var unhashedSalt = sessionStorage.getItem("passwordMD5") + salt;
    console.log("Unhashed salt: " + unhashedSalt);
    var saltedHash = hex_md5(unhashedSalt);
    console.log("Salted Hash: " + saltedHash);
    socket.emit('authMetrics', { passwordMD5: saltedHash, dept: dept, courseCode: sessionStorage.getItem("courseCode") });
}

function onAuthCompleteMetrics(data) {
    if (data.success) {
        $('#alertAuthError').slideUp();
        $('#authPanel').slideUp();
        console.log("Lecturer has authenticated");
        $("#btnOpenLogin").slideUp();
        loggedIn = true;
    }
    else {
        console.log("Lecturer has failed to be authenticated");
        $('#alertAuthError').slideDown();
        loggedIn = false;
    }
}


function onPushedMetrics(data)
{
    if (data.err) {
        console.log(data.err);
        $('#alertDBError').slideDown();
    }
    else {
        console.log(data);
        $('#alertDBError').slideUp();
        //only plot dept distribution if we aren't looking at a specific dept
        if (data.deptHist && !data.dept)
            chartDeptDistributionPie(data.deptHist);
        //only plot course distribution if we aren't looking at a specific course
        if (data.courseHist && !data.courseCode)
            chartCourseDistributionPie(data.courseHist);
        //only plot room distribution if we ARE looking at a specific course AND there's more than one room
        if (data.roomHist && data.courseCode && Object.keys(data.roomHist).length > 1)
            chartRoomDistributionPie(data.roomHist);
        if (data.lecturePeriodHist)
            chartPeriodDistributionPie(data.lecturePeriodHist);
        if (data.lecturePeriodResponseHist)
            chartPeriodResponseBar(data.lecturePeriodResponseHist, data.lecturePeriodResponseErr);
        if (data.dayOfWeekHist)
            chartDailyDistributionPie(data.dayOfWeekHist);
        if (data.dayOfWeekResponseHist)
            chartDayOfWeekResponseBar(data.dayOfWeekResponseHist, data.dayOfWeekResponseErr);
        if (data.weekOfYearHist)
            chartWeeklyDistributionBar(data.weekOfYearHist);
        if (data.weekOfYearResponseHist)
            chartWeekOfYearResponseBar(data.weekOfYearResponseHist, data.weekOfYearResponseErr);
        if (data.monthOfYearHist)
            chartMonthlyDistributionBar(data.monthOfYearHist);
        if (data.monthOfYearResponseHist)
            chartMonthOfYearResponseBar(data.monthOfYearResponseHist, data.monthOfYearResponseErr);
    }
}

function chartPeriodDistributionPie(dist){
    if (dist.length != 8)
        return;
    var totalPolls = 0;
    for (var i in dist)
        totalPolls += dist[i];
    var titleText = 'Lecture period distribution: ' + totalPolls + ' polls';
    var element = '#lecturePeriodChart';
    var data = [['1st', dist[0]],
                ['2nd', dist[1]],
                ['3rd', dist[2]],
                ['4th', dist[3]],
                ['5th', dist[4]],
                ['Meridian', dist[5]],
                ['6th', dist[6]],
                ['7th', dist[7]]];    
    chartDistributionPie(element, titleText, data);
}

function chartDailyDistributionPie(dist) {
    if (dist.length != 7)
        return;
    var totalPolls = 0;
    for (var i in dist)
        totalPolls += dist[i];
    var titleText = 'Daily distribution: ' + totalPolls + ' polls';
    var element = '#dayOfWeekChart';
    var data = [['Mon', dist[1]],
                ['Tues', dist[2]],
                ['Wed', dist[3]],
                ['Thurs', dist[4]],
                ['Fri', dist[5]],
                ['Sat', dist[6]],
                ['Sun', dist[0]]];
    
    chartDistributionPie(element, titleText, data);    
}

function chartDeptDistributionPie(deptHist) {
    var titleText = 'Departmental distribution: ' + sumMap(deptHist) + ' polls';
    chartDistributionPie('#deptDistChart', titleText, transformMap(deptHist));
}

function chartCourseDistributionPie(courseHist) {
    var titleText = 'Course distribution: ' + sumMap(courseHist) + ' polls';
    chartDistributionPie('#courseDistChart', titleText, transformMap(courseHist));
}

function chartRoomDistributionPie(roomHist) {
    var titleText = 'Room distribution: ' + sumMap(roomHist) + ' polls';
    
    //Reformat room names
    var data = transformMap(roomHist);
    for (var i in data) {
        if (data[i][0] == '-1') {
            data[i][0] = 'General';
        }
        else
            data[i][0] = 'Subroom ' + data[i][0];
    }

    chartDistributionPie('#roomDistChart', titleText, data);
}

function chartPeriodResponseBar(dist, distErr) {
    if (dist.length != 8)
        return;    
    chartHistogramBar('#lecturePeriodResponseChart', 'Average student response by lecture period', 'Responses', ['1st','2nd','3rd','4th','5th','Meridian','6th','7th'], 'Number of responses', dist, distErr);
}

function chartDayOfWeekResponseBar(dist, distErr) {    
    if (dist.length != 7)
        return;    
    chartHistogramBar('#dayOfWeekResponseChart', 'Average student response by day of the week', 'Responses', ['Sun','Mon','Tues','Wed','Thurs','Fri','Sat'], 'Number of responses', dist, distErr);
}

function chartWeeklyDistributionBar(dist, distErr) {
    var totalPolls = 0;
    for (var i in dist)
        totalPolls += dist[i];

    var nonEmptyDist = [];
    var nonEmptyDistErr = [];
    var xVals = [];

    var j=0;
    for (var i in dist) {
        if (dist[i] || j) {
            xVals[j] = 'Week ' +  i;
            nonEmptyDist[j] = dist[i];
            if (distErr)
                nonEmptyDistErr[j] = distErr[i];
            j++;
        }        
    }
    chartHistogramBar('#weekOfYearChart', 'Weekly distribution: ' + totalPolls + ' polls', 'Polls', xVals, 'Number of polls', nonEmptyDist, nonEmptyDistErr, 0);
}

function chartMonthlyDistributionBar(dist, distErr) {
    var totalPolls = 0;
    for (var i in dist)
        totalPolls += dist[i];
    
    var nonEmptyDist = [];
    var nonEmptyDistErr = [];
    var months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var xVals = [];

    var j = 0;
    for (var i in dist) {
        if (dist[i] || j) {
            xVals[j] = months[i];
            nonEmptyDist[j] = dist[i];
            if (distErr)
                nonEmptyDistErr[j] = distErr[i];
            j++;
        }
    }

    chartHistogramBar('#monthOfYearChart', 'Monthly distribution: ' + totalPolls + ' polls', 'Polls', xVals, 'Number of polls', nonEmptyDist, nonEmptyDistErr, 0);
}

function chartMonthOfYearResponseBar(dist, distErr) {
    var nonEmptyDist = [];
    var nonEmptyDistErr = [];
    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var xVals = [];

    var j = 0;
    for (var i in dist) {
        if (dist[i] || j) {
            xVals[j] = months[i];
            nonEmptyDist[j] = dist[i];
            if (distErr)
                nonEmptyDistErr[j] = distErr[i];
            j++;
        }
    }

    chartHistogramBar('#monthOfYearResponseChart', 'Average student response by month of the year', 'Responses', xVals, 'Number of responses', nonEmptyDist, nonEmptyDistErr);
}

function chartWeekOfYearResponseBar(dist, distErr) {
    var nonEmptyDist = [];
    var nonEmptyDistErr = [];
    var xVals = [];

    var j = 0;
    for (var i in dist) {
        if (dist[i] || j) {
            xVals[j] = 'Week '+i;
            nonEmptyDist[j] = dist[i];
            if (distErr)
                nonEmptyDistErr[j] = distErr[i];
            j++;
        }
    }
    chartHistogramBar('#weekOfYearResponseChart', 'Average student response by week of the year', 'Responses', xVals, 'Number of responses', nonEmptyDist, nonEmptyDistErr);
}

function chartHistogramBar(element, titleText, seriesName, categories, yTitle, dist, distErr, numDecimals) {
    var series= [{name: seriesName, type: 'column', data: dist}];
    if (distErr)
        series.push({name: 'err', type:'errorbar', data: distErr, enableMouseTracking: false});
    $(element).highcharts({
        chart: {            
            style: {
                fontFamily: '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif'
            },
            borderColor: '#b2dbfb',
            borderWidth: 2,
            borderRadius: 3,
        },
        credits: {
            enabled: false
        },
        title: {
            text: titleText
        },        
        xAxis: {
            categories:categories,
            crosshair: true
        },
        yAxis: {
            min: 0,
            title: {
                text: yTitle
            }
        },
        legend: {
            enabled: false
        },		
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y}</b>',
            valueDecimals: (numDecimals != undefined)?numDecimals: 1
        },
        plotOptions: {
            column: {
                pointPadding: 0.2,
                borderWidth: 0
            }
        },
        series: series
    });    
}

function chartDistributionPie(element, titleText, data) {
    $(element).highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            style: {
                fontFamily: '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif'
            },
            borderColor: '#b2dbfb',
            borderWidth: 2,
            borderRadius: 3,
        },
        credits: {
            enabled: false
        },
        title: {
            text: titleText
        },
        tooltip: {
            pointFormat: '{series.name}: <b>{point.y}</b>'
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer',
                dataLabels: {
                    enabled: false
                },
                showInLegend: true
            }
        },
        series: [{
            type: 'pie',
            name: 'Polls',
            data: data
        }]
    });
}

//Util function for map-like objects
function transformMap(mapObj) {
    var arr = [];
    for (var key in mapObj)
        arr.push([key, mapObj[key]]);
    return arr;
}

function sumMap(mapObj) {
    var sum = 0;
    for (var key in mapObj)
        sum += mapObj[key];
    return sum;
}