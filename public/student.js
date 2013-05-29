var socket;

window.onload = function() 
{
	var messages = [];
	var polls = [];
	sessionStorage.setItem("courseCode", "1004W");
	socket = io.connect(window.location.hostname);	

	socket.on('connectionSuccess', function ()
	{
		console.log("Connected to server, sending course code");
		socket.emit('courseCode', sessionStorage.getItem("courseCode"));
	});
	
	socket.on('joinedRoom', function (data)
	{
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
	var headerHtml="<h3 align='center'>Current Poll: "+pollName+"</h3>";
	headerHtml+="<fieldset align='center' data-theme='a' data-role='controlgroup' data-type='horizontal'>";
	var optionsHtml="";
	var swatch=["", "f", "g", "h", "i", "j"];
	for (var i=1;i<=numOptions;i++)
	{
		optionsHtml+="<a data-role='button' data-transition='fade' data-theme='"+swatch[i]+"' onclick='submitPoll("+i+");'>"+i+"</a>"
	}
	var footerHtml="</fieldset>";
	var totalHtml=headerHtml+optionsHtml+footerHtml;
	$("#poll").html(totalHtml);	
	$('.ui-page-active').page("destroy").page();
}

function submitPoll(option)
{
	console.log("Option "+option+" clicked");
}