
//
//Database functions
//
var dbCollection = 'polls';


//Util
var createIndices = function(db) {
	var collection = db.collection(dbCollection);
	collection.createIndex({ dept: 1, courseCode: 1, roomId: 1 });
}

//Write
//

var insertPoll = function (db, dept, courseCode, roomId, pollName, numOptions, done) {
	if (!db)
		return done({ name: 'DB Error', message: 'The connection to the database has been lost.' });
	var collection = db.collection(dbCollection);
	if (!collection)
		return done({ name: 'DB Error', message: 'The database collection is missing or invalid.' });
	collection.insert({ dept: dept.toLowerCase(), courseCode: courseCode.toLowerCase(), roomId: roomId, pollName: pollName, numOptions: numOptions, numResponses: 0, entries: new Array(numOptions) }, function (err, result) {
		if (err)
			done(err);
		else {
			done(null, result.ops[0]._id);
		}
	});
}

var updatePoll = function(db, pollId, entries, done) {
	var numResponses = 0;
	for (var i = 0; i < entries.length; i++)
		numResponses += entries[i];
	if (!db)
		return done({ name: 'DB Error', message: 'The connection to the database has been lost.' });
	var collection = db.collection(dbCollection);
	if (!collection)
		return done({ name: 'DB Error', message: 'The database collection is missing or invalid.' });
	collection.updateOne({ _id: pollId }, { $set: { numResponses: numResponses, entries: entries } }, function (err, result) {
		if (err)
			done(err);
		else
			done(null, result);
	});
}

//Query
//

var getPolls = function(db, dept, courseCode, roomId, done) {
	var query = {};
	if (dept)
		query.dept = dept.toLowerCase();
	if (courseCode)
		query.courseCode = courseCode.toLowerCase();
	if (roomId)
		query.roomId = roomId;
	var collection = db.collection(dbCollection);
	collection.find(query).toArray(function (err, result) {
		if (err)
			done(err);
		else
			done(null, result);
	});
}


module.exports = {createIndices: createIndices, insertPoll: insertPoll, updatePoll: updatePoll, getPolls: getPolls};