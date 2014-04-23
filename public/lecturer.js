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
    //loading screen
    $.mobile.loader.prototype.options.text = "Loading";
    $.mobile.loader.prototype.options.textVisible = true;
    $.mobile.loader.prototype.options.theme = "a";
    $.mobile.loader.prototype.options.html = "";  	
	$.mobile.loading( 'show');	
}


window.onload = function() 
{	
	location.hash="";
	$('#authError').hide();
	$("#btnNewPoll").addClass('ui-disabled');	
	$.mobile.loading( 'show');
	messages = [];
	polls = [];	
	host="http://"+window.location.hostname+":3700";
	sessionStorage.setItem("courseCode", room.toUpperCase());
	
	openLoginButton = document.getElementById("btnOpenLogin");
	
	
	openLoginButton.onclick = openLogin = function() 
	{			
		$('#popupAuth').popup("open");
	};	
	
	loginButton = document.getElementById("btnLogin");
	loginButton.onclick = login = function() 
	{
		sessionStorage.setItem("passwordMD5", hex_md5($("#password").val()));	
		var unhashedSalt=sessionStorage.getItem("passwordMD5")+salt;
		console.log("Unhashed salt: "+unhashedSalt);		
		var saltedHash=hex_md5(unhashedSalt);
		console.log("Salted Hash: "+saltedHash);
		socket.emit('auth', {passwordMD5: saltedHash, courseCode: sessionStorage.getItem("courseCode")});
		$.mobile.loading( 'show');		
	};
	updateButton = document.getElementById("btnUpdate");
	updateButton.onclick = login;
	newPollButton = document.getElementById("btnNewPoll");
		
	newPollButton.onclick = addNewPoll = function() 
	{	
		if (!loggedIn)
			return;
		var now = new Date();		
		var proposedName=now.format("m_dd_HH_MM");
		//if the previous poll is already called that
		if (proposedName==pollName)
			proposedName+="_alt";
		$("#pollName").attr("value", proposedName);
		$('#popupPoll').popup("open");
	};	
	
	socket = io.connect(host);	
	socket.on('connectionSuccess', function (data)
	{
		salt=data.salt;
		console.log("Connected to server");
		$.mobile.loading( 'hide');
	});
	
	socket.on('authComplete', function (data)
	{
		$.mobile.loading( 'hide');
		if (data.success)
		{
			$('#authError').slideUp();
			
			console.log("Lecturer has authenticated");			
			$('#popupAuth').popup("close");			
			$("#btnNewPoll").removeClass('ui-disabled');			
			$("#btnUpdate").removeClass('ui-disabled');
			$("#btnOpenLogin").slideUp();
			loggedIn=true;
		}
		else
		{
			console.log("Lecturer has failed to be authenticated");
			$('#authError').slideDown();
			loggedIn=false;
		}
	});
	
	socket.on('pushedNewPoll', function (data)
	{
		if (data.success)
		{
			console.log("Poll "+data.pollName+" has been pushed to students");
			$.mobile.loading( 'hide');
			$( "#popupPoll" ).popup( "close" );
			$('#resultsChart').slideUp();			
			firstUpdate=true;
			
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
			if (firstUpdate)
			{	
				$('#resultsChart').hide();
				$('#resultsChart').slideDown();
				firstUpdate=false;
			}
		}		
	});
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
	
	$("#popupAuth").keyup(function(e) 
	{
		if(e.keyCode == 13) 
		{
			login();
		}
	});
});

$(document).on('pagebeforeshow', '#page1', function()
{ 	
	$( "#popupPoll" ).popup({
        afteropen: function( event, ui ) 
		{
            $('#pollName').focus();
			$('#pollName').select();
        }
    });	
	$( "#popupAuth" ).popup({
        afteropen: function( event, ui ) {
            $('#password').focus();
        }
    });	
});

function CreatePoll()
{
	$.mobile.loading( 'show');
	console.log("Creating Poll");
	var unhashedSalt=sessionStorage.getItem("passwordMD5")+salt;
	console.log("Unhashed salt: "+unhashedSalt);
	var saltedHash=hex_md5(unhashedSalt);
	console.log("Salted Hash: "+saltedHash);
	socket.emit('newPoll', {passwordMD5: saltedHash, courseCode: sessionStorage.getItem("courseCode"), pollName: $('#pollName').val(), numOptions: $('#sliderNumoptions').val() });
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
            text: '<b>Poll Results ('+totalVotes+' vote'+(totalVotes==1?'':'s')+'): </b>'+pollName,
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
                [0, '#0071bc'],
                [1, '#2091dc']
                ]
            }, {
			linearGradient: perShapeGradient,
            stops: [
                [0, '#03070f'],
                [1, '#03070f']
                ]
            }, {
            linearGradient: perShapeGradient,
            stops: [
                [0, '#f7931e'],
                [1, '#f7b33e']				
                ]}, 
			{
            linearGradient: perShapeGradient,
            stops: [
                [0, '#aF00aF'],
                [1, '#dF10dF']				
                ]},
			{linearGradient: perShapeGradient,
            stops: [
                [0, '#5E9AC4'],
                [1, '#3D6FA2']				
                ]},
			{linearGradient: perShapeGradient,
            stops: [
                [0, '#FFEEA6'],
                [1, '#FFE25C']				
                ]}
        ],
        series: [{name: 'Votes',data: results}]
    });    
    chart.redraw();	
}
