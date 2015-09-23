var socket;

$( document ).bind( 'mobileinit', initFunction);
if (!window.console) console = {log: function() {}};

function initFunction()
{
    //disable zooming
    $.extend($.mobile.zoom, {locked:true,enabled:false});  
}

window.onload = function() 
{
	$("#pollPanel").hide();
	hideAlerts();	
	$("#alertStudentWaiting").slideDown();
	location.hash="";
	var messages = [];
	var polls = [];
	//room variable comes from jade parameter (server-sent)
	sessionStorage.setItem("courseCode", room.toUpperCase());
	
	var host="http://"+window.location.hostname+":"+socketPort;
	socket = io.connect(host);		
		
	socket.on('connectionSuccess', function ()
	{
		console.log("Connected to server, sending course code");
		var existingUuid=localStorage.getItem("polling_uuid");		
		socket.emit('courseCode', {courseCode:sessionStorage.getItem("courseCode"), uuid:existingUuid});		
	});
	
	socket.on('joinedRoom', function (data)
	{
		if (data.success)
		{
			console.log("Client has been placed in the "+data.roomName+" room");
			console.log("polling_uuid: "+ data.uuid);
			localStorage.setItem("polling_uuid", data.uuid);
		}
		else
			console.log("Client has failed to join room");
	});
	
	socket.on('pushNewPoll', function (data) 
	{
		if(data.pollName) 
		{
			console.log("Current poll: ", data.pollName+". Number of options: "+data.numOptions);
			displayPollOptions(data.pollName, data.numOptions);			
		} 
		else 
		{
			console.log("There is a problem:", data);
		}
	});	
}

function displayPollOptions(pollName, numOptions)
{
	$("#pollHeading").html("Current Poll: "+pollName);
	slideUpAlerts();
	$("#pollPanel").slideUp();
	
	var divHtml="<div class='col-lg-3 col-md-4 col-sm-6 col-xs-12 bottom7'>"	
	var optionsHtml="<div class='row'>";
	var buttonClass="btn btn-hg btn-block btn-info"	
	for (var i=0;i<numOptions;i++)
	{
		var optionLetter=String.fromCharCode('A'.charCodeAt() + i);		
		optionsHtml+=divHtml+"<button type='button' class='"+buttonClass+" btn-"+optionLetter+"' onclick='submitPoll(\""+pollName+"\" ,"+(i+1)+");'>Option "+optionLetter+" / " +(i+1)+"</button></div>"
	}
	optionsHtml+="</div>"	
	$("#poll").html(optionsHtml);				
	$("#pollPanel").slideDown();
}

function submitPoll(pollName, option)
{
	slideUpAlerts();
	console.log("Option "+option+" clicked");
	socket.emit('pollSubmission', {courseCode:sessionStorage.getItem("courseCode"), pollName:pollName, uuid:localStorage.getItem("polling_uuid"), submission:option});
		
	socket.on('pollSubmissionComplete', function (data)
	{
		if (data.success)
		{				
			$("#pollPanel").slideUp();
			$("#pollName").html(pollName);			
			$( "#alertStudentSubmitted" ).slideDown();			
		}
		else
		{
			$("#pollNameError").html(pollName);
			if (data.reason == 'missingData')
				$("#pollErrorDetails").html("<b>Error</b>: Missing data. Refresh the page to reconnect.");
			else if (data.reason == 'invalidPoll')
				$("#pollErrorDetails").html("<b>Error</b>: Poll is no longer available. Refresh the page to reconnect.");
			else if (data.reason == 'outOfRange')
				$("#pollErrorDetails").html("<b>Error</b>: Poll entry is out of range. Try another option.");
			else if (data.reason == 'duplicate')
				$("#pollErrorDetails").html("<b>Error</b>: You have already answered this poll. If you believe this is incorrect, try refreshing the page.");
			else if (data.reason == 'closedPoll')
				$("#pollErrorDetails").html("<b>Error</b>: Poll has been closed.");
			else
				$("#pollErrorDetails").html("<b>Error</b>: An unknown error occurred.");
				
			$( "#alertStudentError" ).slideDown();
		}
			
	});	
}

function slideUpAlerts()
{
	$( "#alertStudentSubmitted" ).slideUp();
	$( "#alertStudentError" ).slideUp();
	$( "#alertStudentWaiting" ).slideUp();
}

function hideAlerts()
{
	$( "#alertStudentSubmitted" ).hide();
	$( "#alertStudentError" ).hide();
	$( "#alertStudentWaiting" ).hide();
}