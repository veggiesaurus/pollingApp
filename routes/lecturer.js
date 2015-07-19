module.exports = function (app, socketPort){
	
	app.get("/lecView/:dept/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res)
    {
	    res.render("lecturer", {socketPort:socketPort, dept:req.params.dept, room:req.params.dept+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});
    });

    app.get("/lecView/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res)
    {
	    res.render("lecturer", {socketPort:socketPort, dept:'phy', room:'phy'+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});
    });
	
};