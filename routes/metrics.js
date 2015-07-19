module.exports = function (app, socketPort){
	
    app.get("/metrics/:dept/:id([0-9]+):courseType(w|f|h|s)(\/(:sub([0-9])))?", function (req, res) {        
        res.render("metrics", { socketPort: socketPort, dept: req.params.dept, room: req.params.dept + req.params.id + req.params.courseType + (req.params.sub?req.params.sub:"")});                
    });
    
    app.get("/metrics/:dept", function (req, res) {
        res.render("metrics", { socketPort: socketPort, dept: req.params.dept});
    });
    
    app.get("/metrics", function (req, res) {
        res.render("metrics", { socketPort: socketPort});
    });
	
};