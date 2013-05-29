var socket;

window.onload = function() 
{
	var messages = [];
	var polls = [];
	sessionStorage.setItem("courseCode", "1004W");
	socket = io.connect('http://localhost:3700');	

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