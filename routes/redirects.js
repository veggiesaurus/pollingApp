module.exports = function (app){
	app.get("/poll", function(req, res)
    {
	    res.redirect("/");
    });
    app.get("/poll/:afterURL(*)", function (req, res) {
	    res.redirect("/"+req.params.afterURL)    
	});
};