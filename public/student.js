var socket;

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
	$.mobile.loading('show');
	var messages = [];
	var polls = [];
	sessionStorage.setItem("courseCode", "1004W");
	sessionStorage.setItem("username", "cmrang001");
	
	var host="http://"+window.location.hostname+":3700";
	socket = io.connect(host);		
	
	
	socket.on('connectionSuccess', function ()
	{
		console.log("Connected to server, sending course code");
		socket.emit('courseCode', sessionStorage.getItem("courseCode"));
	});
	
	socket.on('joinedRoom', function (data)
	{
		$.mobile.loading( 'hide');
		if (data.success)
			console.log("Client has been placed in the "+data.roomName+" room");
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
	var optionsHtml="";
	//have to minus 1 because poll options are 1->N and array is 0->N-1
	var swatch=["f", "g", "h", "i", "j"];
	for (var i=0;i<numOptions;i++)
	{
		optionsHtml+="<a data-role='button' data-transition='fade' data-theme='"+swatch[i]+"' onclick='submitPoll(\""+pollName+"\" ,"+(i+1)+");'>Option "+(i+1)+"</a>"
	}
	$("#poll").html(optionsHtml);		
	$('.ui-page-active').page("destroy").page();
	$('#pollCollapsible').trigger('expand');
	
}

function submitPoll(pollName, option)
{
	$.mobile.loading('show');
	console.log("Option "+option+" clicked");
	socket.emit('pollSubmission', {courseCode:sessionStorage.getItem("courseCode"), pollName:pollName, username:sessionStorage.getItem("username"), submission:option});
		
	socket.on('pollSubmissionComplete', function (data)
	{
		$.mobile.loading( 'hide');
		if (data.success)
		{
			$("#poll").html("<h3 align='center'>Submitted poll \""+pollName+"\"</h3>");
			$('.ui-page-active').page("destroy").page();
		}
		else
		{
			if (data.reason == 'missingData')
				$("#popupStudentErrorMessage").html("<b>Error</b>: Missing data. Refresh the page to reconnect.");
			else if (data.reason == 'invalidPoll')
				$("#popupStudentErrorMessage").html("<b>Error</b>: Poll is no longer open. Refresh the page to reconnect.");
			else if (data.reason == 'outOfRange')
				$("#popupStudentErrorMessage").html("<b>Error</b>: Poll entry is out of range. Try another option.");
			else if (data.reason == 'duplicate')
				$("#popupStudentErrorMessage").html("<b>Error</b>: You have already answered this poll. If you believe this is incorrect, try refreshing the page.");
			else
				$("#popupStudentErrorMessage").html("<b>Error</b>: An unknown error occured.");
			
			$( "#popupStudentError" ).popup("open");
			//alert("Client has failed to submit poll");
		}
			
	});
	
}