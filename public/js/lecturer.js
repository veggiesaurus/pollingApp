var messages;
var socket;
var newPollButton;
var chatBox;
var salt;
var pollName="";
var results=new Array(5);
var polls;		
var host;
var loggedIn=false;
var firstUpdate=true;

$( document ).bind( 'mobileinit', initFunction);
if (!window.console) console = {log: function() {}};




function initFunction()
{
    //disable zooming
    $.extend($.mobile.zoom, {locked:true,enabled:false});
}




window.onload = function() 
{   
	$('#alertAuthError').hide();
	$("#btnNewPoll").addClass('ui-disabled');		
	location.hash="";
	messages = [];
	polls = [];	
	host="http://"+window.location.hostname+":"+socketPort;
	sessionStorage.setItem("courseCode", room.toUpperCase());
	
    $("#options").slider();
    $("#options").on("slide", function (slideEvt) {
        $("#optionVal").text(slideEvt.value);
    });
	
	setupEvents();
	
	socket = io.connect(host);	
	socket.on('connectionSuccess', function (data)
	{
		salt=data.salt;
		console.log("Connected to server");
	});
	
	socket.on('authComplete', onAuthComplete);	
	socket.on('pushedNewPoll', onPushedNewPoll);	
	socket.on('pushResults', onPushedResults);
}

$(document).ready(function() 
{	
	$("#pollName").keyup(function(e) 
	{
		if(e.keyCode == 13) 
		{
			createPoll();
		}
	});
	
	$("#password").keyup(function(e) 
	{
		if(e.keyCode == 13) 
		{
			submitAuth();
		}
	});
});

function setupEvents()
{
	$("#btnLogin").off().click(submitAuth);		
	$("#btnReAuth").off().click(submitAuth);	
	$("#btnNewPoll").off().click(addNewPoll);
	$("#btnAcceptPoll").off().click(createPoll);
	$("#btnCancelPoll").off().click(hidePollPanel);
	$("#optionsSlider").on("change", updateSliderText);
	$("#optionsSlider" ).on("slide", updateSliderText);
	$("#password").focus();
	$("#password").select();
}

function onAuthComplete(data)
{		
	if (data.success)
	{
		$('#alertAuthError').slideUp();
		$('#authPanel').slideUp();
		$('#createPollRow').slideDown();
		console.log("Lecturer has authenticated");						
		$("#btnNewPoll").removeClass('ui-disabled');			
		$("#btnReAuth").removeClass('ui-disabled');
		$("#btnOpenLogin").slideUp();
		loggedIn=true;
	}
	else
	{
		console.log("Lecturer has failed to be authenticated");
		$('#alertAuthError').slideDown();
		loggedIn=false;
	}
}

function onPushedNewPoll(data)
{
	if (data.success)
	{
		console.log("Poll "+data.pollName+" has been pushed to students");			
		$("#pollPanel").slideUp();
		$('#resultsChart').slideUp();			
		firstUpdate=true;
		
	}
	else
		console.log("Poll has not been pushed to students");					
}

function onPushedResults(data)
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
		if (firstUpdate)
		{	
			$('#resultsChart').hide();
			$('#resultsChart').slideDown();
			firstUpdate=false;
		}
	}		
}

function submitAuth()
{	
	sessionStorage.setItem("passwordMD5", hex_md5($("#password").val()));
	var unhashedSalt=sessionStorage.getItem("passwordMD5")+salt;
	console.log("Unhashed salt: "+unhashedSalt);
	var saltedHash=hex_md5(unhashedSalt);
	console.log("Salted Hash: "+saltedHash);
	socket.emit('auth', {passwordMD5: saltedHash, dept: dept, courseCode: sessionStorage.getItem("courseCode")});	
}

function addNewPoll()
{	
	if (!loggedIn)
		return;
	$("#pollPanel").slideDown();
	var now = new Date();		
	var proposedName=now.format("m_dd_HH_MM");
	//if the previous poll is already called that
	if (proposedName==pollName)
		proposedName+="_alt";
	$("#pollName").attr("value", proposedName);	
	$('#pollName').focus();
	$('#pollName').select();
}

function hidePollPanel()
{
	$("#pollPanel").slideUp();
}

function createPoll()
{
	console.log("Creating Poll");
	var unhashedSalt=sessionStorage.getItem("passwordMD5")+salt;
	console.log("Unhashed salt: "+unhashedSalt);
	var saltedHash=hex_md5(unhashedSalt);
	console.log("Salted Hash: "+saltedHash);
	socket.emit('newPoll', {passwordMD5: saltedHash, dept: dept, courseCode: sessionStorage.getItem("courseCode"), pollName: $('#pollName').val(), numOptions: $("#optionVal").text()});
}

var updateSliderText = function (event, ui) {
	$('#optionsCount').text(ui.value);	
}

function chartResults(pollName, results)
{
    //create the histogram with empty values	
    var xVals=new Array(results.length);	
	var totalVotes=0;
	for (var i=0;i<xVals.length;i++)
	{
		xVals[i]=String.fromCharCode('A'.charCodeAt() + i)+" / " +(i+1);
		totalVotes+=results[i];
	}	
	var perShapeGradient = {
		x1: 0,
		y1: 0,
		x2: 0,
		y2: 1
	};
		
    chart = new Highcharts.Chart({
        chart: {
            borderColor: '#b2dbfb',
            borderWidth: 2,
            borderRadius: 3,
            renderTo: 'resultsChart',                
            animation: true,
            type: 'column',
            style: {
                fontFamily: '"Roboto","Helvetica Neue",Helvetica,Arial,sans-serif'
            }
        }, 
		credits: {
            enabled: false
        },
        title: {
            text: '<b>Poll Results ('+totalVotes+' vote'+(totalVotes==1?'':'s')+'): </b>'+pollName,
			style:
			{
				fontSize: '150%'
			}
        },
		exporting: 
		{
            filename: sessionStorage.courseCode+'_'+pollName
        },
        subtitle: {            
            text: sessionStorage.courseCode,
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
            },
            allowDecimals: false,
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
                padding: '5px',
            }
            
        },
        plotOptions: 
        {
            series: {
                borderWidth: 0,
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
		colors: ['#c1272d', '#009245', '#2091dc', '#03070f', '#f7931e', '#aF00aF', '#5e9ac4', '#ffdc38'],
        series: [{name: 'Votes',data: results}]
    });    
    chart.redraw();	
}
