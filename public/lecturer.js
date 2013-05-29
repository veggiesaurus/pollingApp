var messages;
var socket;
var newPollButton;
var chatBox;
window.onload = function() 
{
	messages = [];
	var polls = [];	
	socket = io.connect('http://localhost:3700');		
	newPollButton = document.getElementById("btnNewPoll");
	chatBox = document.getElementById("chatBox");	
	
	sessionStorage.setItem("courseCode", "1004W");
	//dummy password for now (md5("test"))
	sessionStorage.setItem("passwordMD5", "098f6bcd4621d373cade4e832627b4f6");
	
	
	socket.on('connectionSuccess', function ()
	{
		console.log("Connected to server, sending course code");
		socket.emit('auth', {passwordMD5: sessionStorage.getItem("passwordMD5"), courseCode: sessionStorage.getItem("courseCode")});
	});
	
	socket.on('authComplete', function (data)
	{
		if (data.success)
			console.log("Lecturer has authenticated");
		else
			console.log("Lecturer has failed to be authenticated");
	});
	
	socket.on('pushedNewPoll', function (data)
	{
		if (data.success)
			console.log("Poll "+data.pollName+" has been pushed to students");
		else
			console.log("Poll has not been pushed to students");
	});
	
	
	newPollButton.onclick = addNewPoll = function() 
	{
		$('#popupBasic').popup("open");
	};
}



$(document).ready(function() 
{	
	$("#popupBasic").keyup(function(e) 
	{
		if(e.keyCode == 13) 
		{
			CreatePoll();
		}
	});
});

$(document).on('pagebeforeshow', '#page1', function(){ 
    $( "#popupBasic" ).popup({
        afteropen: function( event, ui ) {
            $('#pollName').focus();
        }
    });
});

function CreatePoll()
{
	console.log("Creating Poll");
	socket.emit('newPoll', {passwordMD5: sessionStorage.getItem("passwordMD5"), courseCode: sessionStorage.getItem("courseCode"), pollName: $('#pollName').val(), numOptions: $('#sliderNumoptions').val() });
}