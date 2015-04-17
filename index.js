var express = require("express");
var http = require('http');
var crypto = require('crypto');
var shortId = require('shortid');
var app = express();
var server = http.Server(app);
var io = require('socket.io')(server);
var configs = require('./secrets.json');
var port = 3700;
var socketPort = 3701
var uuidCounter=1040;
var mapPolls={};
var mapClients={};
var mapTimers={};
var mapResults={};
var mapSalts={};
				 
app.set('views', __dirname + '/tpl');
app.set('view engine', "jade");
app.engine('jade', require('jade').__express);
app.set('view options', { pretty: true });
app.use(express.static(__dirname + '/public'));

io.set('log level', 5);                    // reduce logging
//production settings

//io.enable('browser client minification');  // send minified client

//io.enable('browser client etag');          // apply etag caching logic based on version number
//io.enable('browser client gzip');          // gzip the file
io.set('log level', 1);                    // reduce logging

io.set('transports', ['websocket',                       
                      'htmlfile', 
                      'xhr-polling', 
                      'jsonp-polling', 
                      'polling']);

io.listen(socketPort);
app.get("/lecView/:dept/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res)
{
	//Logging for debugging purposes
	//console.log("Req params: %j", req.params);
	res.render("lecturer", {socketPort:socketPort, dept:req.params.dept, room:req.params.dept+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});
});


app.get("/:dept/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res){	
	res.render("student", {socketPort:socketPort, room:req.params.dept+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});	
});


app.get("/", function(req, res){
	res.render("student");
});

io.sockets.on('connection', function (socket) 
{
	console.log("Client connected. Waiting for course code or auth");
	mapSalts[socket.id]=Math.floor((Math.random()*2000000)+1);
	socket.emit('connectionSuccess', {salt:mapSalts[socket.id]});
	//callbacks	
	socket.on('courseCode', function (data) {onCourseCodeProvided(socket, data);});
	socket.on('auth', function (data){onAuth(socket,data);});		
	socket.on('newPoll', function (data){addNewPoll(socket, data);});	
	socket.on('pollSubmission', function (data){onPollSubmission(socket, data);});	
});

function onCourseCodeProvided(socket, data)
{
	//check for valid course code
	if (data.courseCode)
	{		
		var courseCode=data.courseCode.toUpperCase();		
		var uuid=data.uuid;
		if (!isValidUUID(uuid))
		{
			uuid=shortId.generate();
			console.log("new uuid: "+uuid);
		}
		else
			console.log("valid uuid: "+uuid);
		console.log("Client (" + uuid+") has been placed in room: "+courseCode);
		socket.join(courseCode);
		socket.emit('joinedRoom', {roomName:courseCode, uuid: uuid, success: true});
		//check if there is a current poll and the client hasn't already responsed to it
		if (mapPolls[courseCode] && !mapPolls[courseCode].submittedClients[uuid])
			socket.emit('pushNewPoll', {pollName: mapPolls[courseCode].pollName, numOptions:mapPolls[courseCode].numOptions});
	}
}

function onAuth(socket, data)
{			
	var deptPasswordMD5=getPasswordForDept(data.dept);
	var unhashedSalt=deptPasswordMD5+mapSalts[socket.id];
	console.log("Unhashed salt: "+unhashedSalt);
	var saltedHash=crypto.createHash('md5').update(unhashedSalt).digest("hex");
	console.log("Salted Hash: "+saltedHash);
	if (deptPasswordMD5 && data.passwordMD5==saltedHash)
	{
		data.courseCode=data.courseCode.toUpperCase();
		console.log("Lecturer has authenticated and been placed in room: "+data.courseCode+"_admin");
		socket.join(data.courseCode+"_admin");
		socket.emit('authComplete', {courseCode:data.courseCode, success: true});
	}
	else
	{
		console.log("Authentication error");
		socket.emit('authComplete', {courseCode:data.courseCode, success: false});
	}
}

function addNewPoll(socket, data)
{	
	console.log("Recieved new poll: %j", data);
	if (data.dept && data.courseCode)
		data.courseCode=data.courseCode.toUpperCase();
	else
	{
		socket.emit('pushedNewPoll', {pollName: data.pollName, success: false});
		return;
	};
	var deptPasswordMD5=getPasswordForDept(data.dept);
	var saltedHash=crypto.createHash('md5').update(deptPasswordMD5+mapSalts[socket.id]).digest("hex");
	if(deptPasswordMD5 && data.passwordMD5==saltedHash && data.pollName && data.courseCode)
	{
	
		//in case the socket has been disconnected since last time, put the lecturer back in the right room
		data.courseCode=data.courseCode.toUpperCase();
		socket.join(data.courseCode+"_admin");
		
		//emit poll to everyone else
		console.log("Pushing new poll to students: "+data.pollName);
		mapPolls[data.courseCode]={pollName: data.pollName, numOptions:data.numOptions, submittedClients:{}};
		io.sockets.in(data.courseCode).emit('pushNewPoll', {pollName: data.pollName, numOptions:data.numOptions});
		
		//emit success to the lecturer
		socket.emit('pushedNewPoll', {pollName: data.pollName, success: true});

		//results
		var len=parseInt(data.numOptions);
		var results=new Array(len);
		for (var i=0;i<results.length;i++)
			results[i]=0;
		mapResults[data.courseCode]={pollName:data.pollName, results:results};
		
		//callback timers		
		if (mapTimers[data.courseCode])
			clearTimeout(mapTimers[data.courseCode]);
		mapTimers[data.courseCode]=setInterval(pushResults=function()
		{	
			//Logging for debugging purposes
			//console.log("Pushing results of poll \""+mapResults[data.courseCode].pollName+"\"to lecturer");
			io.sockets.in(data.courseCode+"_admin").emit('pushResults', mapResults[data.courseCode]);
		}, 2000);
		pushResults();
	}
	else
	{
		//emit failure to lecturer
		socket.emit('pushedNewPoll', {pollName: data.pollName, success: false});
		console.log("Failed to push poll: "+data.pollName);
	}
}

function onPollSubmission(socket, data)
{	
	if (data.courseCode)
		data.courseCode=data.courseCode.toUpperCase();
	console.log("Recieved new poll reply");
	
	if(!data.courseCode || !data.pollName || !data.submission)
	{
		console.log("Invalid poll reply: missing data");
		socket.emit('pollSubmissionComplete', {pollName: data.pollName, success: false, reason:'missingData'});
	}
	else if (!mapPolls[data.courseCode] || data.pollName!=mapPolls[data.courseCode].pollName)
	{
		console.log("Invalid poll reply: poll is not available");
		socket.emit('pollSubmissionComplete', {pollName: data.pollName, success: false, reason:'invalidPoll'});
	}
	else if (data.submission<1 || data.submission>mapResults[data.courseCode].results.length+1)
	{
		console.log("Invalid poll reply: submission is out of range");
		socket.emit('pollSubmissionComplete', {pollName: data.pollName, success: false, reason:'outOfRange'});
	}
	else if (!data.uuid || !isValidUUID(data.uuid) || mapPolls[data.courseCode].submittedClients[data.uuid] )
	{
		console.log("Invalid poll reply: client has already submitted poll response");
		socket.emit('pollSubmissionComplete', {pollName: data.pollName, success: false, reason:'duplicate'});
	}
	else
	{
		//have to minus 1 because poll options are 1->N and array is 0->N-1
		mapResults[data.courseCode].results[data.submission-1]++;
		//record IP address of those who submitted
		mapPolls[data.courseCode].submittedClients[data.uuid]=true;
		//emit success to the student
		socket.emit('pollSubmissionComplete', {pollName: data.pollName, success: true});			
	}		
}

function isValidUUID(uuid)
{
	if (uuid===null || uuid==undefined || uuid=="undefined"|| uuid.length<6 || uuid.length>12)
		return false;
	else
		return true;
}

function getPasswordForDept(dept)
{		
	if (dept)
	{
		var requestedExtension=dept.toUpperCase();
		for (i=0;i<configs.departments.length;i++)
		{
			if (requestedExtension == configs.departments[i].extension.toUpperCase())
				return configs.departments[i].passwordMD5;							
		}
	}
	return false;
}

server.listen(port, function(){
  console.log('listening on port '+port);
});