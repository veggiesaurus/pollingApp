module.exports = function (app, socketPort){
	
	app.get("/:dept/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res){	
	    res.render("student", {socketPort:socketPort, room:req.params.dept+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});	
    });

    app.get("/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function(req, res){	
	    res.render("student", {socketPort:socketPort, room:'phy'+req.params.id+req.params.courseType+(req.params.sub?req.params.sub:"")});	
    });
       
};