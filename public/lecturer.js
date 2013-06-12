var messages;
var socket;
var newPollButton;
var chatBox;

var pollName="";
var results=new Array(5);



$( document ).bind( 'mobileinit', initFunction);

function initFunction()
{
    //disable zooming
    $.extend($.mobile.zoom, {locked:true,enabled:false});
    //loading screen
    $.mobile.loader.prototype.options.text = "Loading";
    $.mobile.loader.prototype.options.textVisible = true;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = "";  
}


window.onload = function() 
{	
	$.mobile.loading( 'show');
	messages = [];
	var polls = [];	
	var host="http://"+window.location.hostname+":3700";
	socket = io.connect(host);	
	newPollButton = document.getElementById("btnNewPoll");
	chatBox = document.getElementById("chatBox");	
	
	sessionStorage.setItem("courseCode", room.toUpperCase());
	//dummy password for now (md5("test"))
	sessionStorage.setItem("passwordMD5", "098f6bcd4621d373cade4e832627b4f6");
	
	
	socket.on('connectionSuccess', function ()
	{
		
		console.log("Connected to server, sending course code");
		socket.emit('auth', {passwordMD5: sessionStorage.getItem("passwordMD5"), courseCode: sessionStorage.getItem("courseCode")});
	});
	
	socket.on('authComplete', function (data)
	{
		$.mobile.loading( 'hide');
		if (data.success)
			console.log("Lecturer has authenticated");
		else
			console.log("Lecturer has failed to be authenticated");
	});
	
	socket.on('pushedNewPoll', function (data)
	{
		if (data.success)
		{
			console.log("Poll "+data.pollName+" has been pushed to students");
			$.mobile.loading( 'hide');
			$( "#popupPoll" ).popup( "close" );
			
		}
		else
			console.log("Poll has not been pushed to students");
		$.mobile.loading( 'hide');					
	});
	
	socket.on('pushResults', function (data)
	{
		var dataChanged=false;
		for (var i=0;i<results.length;i++)
		{
			if (results[i]!=data.results[i])
			{
				dataChanged=true;
				break;
			}
		}
		
		if (!pollName || data.pollName!=pollName || dataChanged)
		{
			results=data.results;
			pollName=data.pollName;
			chartResults(data.pollName, data.results);
		}
	});
	
	
	newPollButton.onclick = addNewPoll = function() 
	{
		$('#popupPoll').popup("open");
	};
}



$(document).ready(function() 
{	
	$("#popupPoll").keyup(function(e) 
	{
		if(e.keyCode == 13) 
		{
			CreatePoll();
		}
	});
});

$(document).on('pagebeforeshow', '#page1', function(){ 
    $( "#popupPoll" ).popup({
        afteropen: function( event, ui ) {
            $('#pollName').focus();
        }
    });
});

function CreatePoll()
{
	$.mobile.loading( 'show');
	console.log("Creating Poll");
	socket.emit('newPoll', {passwordMD5: sessionStorage.getItem("passwordMD5"), courseCode: sessionStorage.getItem("courseCode"), pollName: $('#pollName').val(), numOptions: $('#sliderNumoptions').val() });
}

function chartResults(pollName, results)
{
    //create the histogram with empty values
	
    var xVals=new Array(results.length);
	for (var i=0;i<xVals.length;i++)
		xVals[i]=i+1;
		
	var perShapeGradient = {
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 1
	};
		
		
    chart = new Highcharts.Chart({
        chart: {
            borderColor: '#000000',
            borderWidth: 2,
            renderTo: 'resultsChart',                
            animation: true,
            type: 'column'
        }, 
		credits: {
            enabled: false
        },
        title: {
            text: '<b>Poll Results: </b>'+pollName,
			style:
			{
				fontSize: '150%'
			}
        },
		exporting: 
		{
            filename: 'PHY'+sessionStorage.courseCode+'_'+pollName
        },
        subtitle: {            
            text: 'PHY'+sessionStorage.courseCode,
			style:
			{
				fontSize: '150%'
			}
        },  
		legend: {
            enabled: false
        },		
        xAxis: {
            categories: xVals,
            labels: 
			{
				align:"center", 
				overflow: 'justify',
				y:25,
				style: 
				{
					fontSize: '150%'
				}
			}			
        },
        yAxis: {
            min: 0,
            title: 
			{
                text: 'Count',
				style:
				{
					fontSize: '150%'
				}
				
            },
			labels: {
                style: {
                    fontSize: '150%'
                }
            }
        },
        tooltip: 
        {
			enabled: false,
            backgroundColor: 
            {
                linearGradient: [0, 0, 0, 60],
                stops: [
                [0, '#FFFFFF'],
                [1, '#E0E0E0']
                ]
            },
            borderWidth: 2,
            borderColor: '#000',
            style: 
            {
                color: '#333333',               
                padding: '5px'
            }
            
        },
        plotOptions: 
        {
            series: {
                borderWidth: 1,
                borderColor: 'black',
                animation: false
            },
            column: 
            {
                pointPadding: 0.05,
                groupPadding: 0.1,
                borderWidth: 1,
				colorByPoint: true
            }			
        },		
		colors: [{
            linearGradient: perShapeGradient,
            stops: [
                [0, '#c1272d'],
                [1, '#f1475d']
                ]
            }, {
            linearGradient: perShapeGradient,
            stops: [
                [0, '#009245'],
                [1, '#20a265']
                ]
            }, {
			linearGradient: perShapeGradient,
            stops: [
                [0, '#f7931e'],
                [1, '#f7b33e']
                ]
            }, {
			linearGradient: perShapeGradient,
            stops: [
                [0, '#0071bc'],
                [1, '#2091dc']
                ]
            }, {
            linearGradient: perShapeGradient,
            stops: [
                [0, '#93278f'],
                [1, '#b347af']
                ]}, 
        ],
        series: [{name: 'Votes',data: results}]
    });    
    chart.redraw();    
}
