drawPointChart = function(div, data){
    px = d3.scale.ordinal()
	.rangeRoundBands([0, width], .2);

    py = d3.scale.linear()
	.range([height,0]);

    var xAxis = d3.svg.axis()
	.scale(px)
	.orient("bottom");

    var yAxis = d3.svg.axis()
	.scale(py)
	.orient("left")

    psvg = d3.select(div).append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")

    px.domain(data.map(function(d,i) { return i; }));
    console.log(px.domain());
    py.domain([-2, 2]);

    psvg.append('line')
	.attr('x1',px(0))
	.attr('x2',px(19))
	.attr('y1',py(-0.5))
	.attr('y2',py(-0.5))
	.style('stroke','grey')
	.style('stroke-dasharray', '5, 5')

    psvg.append('line')
	.attr('x1',px(0))
	.attr('x2',px(19))
	.attr('y1',py(0.5))
	.attr('y2',py(0.5))
	.style('stroke','grey')
	.style('stroke-dasharray', '5, 5')

    psvg.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Value Added (grades)");

    psvg.selectAll(".point")
	.data(data)
	.enter().append("circle")
	.attr("class", "point")
	.attr("cx", function(d,i) { return px(i); })
	.attr("cy", function(d) { return py(d); })
	.attr("r", 10)
	.style("fill", function(d) {return d< -0.5 ? "red" : "steelblue"});
}

drawBarChart = function(div, data){
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 860 - margin.left - margin.right,
    height = 300 - margin.top - margin.bottom;

    var formatPercent = d3.format(".0%");

    x = d3.scale.ordinal()
	.rangeRoundBands([0, width], .1);

    y = d3.scale.linear()
	.range([height, 0]);

    var xAxis = d3.svg.axis()
	.scale(x)
	.orient("bottom");

    var yAxis = d3.svg.axis()
	.scale(y)
	.orient("left")
	.tickFormat(formatPercent);

    var rngCol = ["#543005","#8c510a","#bf812d","#dfc27d","#f6e8c3","#f5f5f5","#c7eae5","#80cdc1","#35978f","#01665e","#003c30"];

    color = d3.scale.ordinal()
	.domain(['0','1','2','3','4','5','6','7','8','9'])
	.range(rngCol);

    svg = d3.select(div).append("svg")
	.attr("width", width + margin.left + margin.right)
	.attr("height", height + margin.top + margin.bottom)
	.append("g")
	.attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	.attr("class", "BrBG");

    x.domain(data.map(function(d) { return d.score; }));
    y.domain([0, d3.max(data, function(d) { return d.freq; })]);

    svg.append("g")
	.attr("class", "x axis")
	.attr("transform", "translate(0," + height + ")")
	.call(xAxis);

    svg.append("g")
	.attr("class", "y axis")
	.call(yAxis)
	.append("text")
	.attr("transform", "rotate(-90)")
	.attr("y", 6)
	.attr("dy", ".71em")
	.style("text-anchor", "end")
	.text("Frequency");

    svg.selectAll(".bar")
	.data(data)
	.enter().append("rect")
	.attr("class", "bar")
	.attr("x", function(d) { return x(d.score); })
	.attr("width", x.rangeBand())
	.attr("y", function(d) { return y(d.freq); })
	.attr("height", function(d) { return height - y(d.freq) > 0 ? height - y(d.freq) : 0 ; })
	.style("fill", function(d) {return color(d3.bisectLeft(cumBnds.sort(),d.freq))});

    function type(d) {
	d.freq = +d.freq;
	return d;
    }
}

genSet = function(ar,mn,mx){
    //initialise array
    var n = ar.length;
    var sz = mx + 1;
    var obj = Array.apply(0, Array(sz)).map(function (x, y) { return 0; });
    //count up scores
    for(var i=0; i < n; i++){
	obj[ar[i]] ++;
    }
    //convert to cumulative frequency
    var tmp = 1;
    var cums = [tmp.toFixed(3)];
    for(var i=0; i < obj.length; i++){
	var tmp = cums[i]-(obj[i]/n);
	cums.push(Math.round(tmp*1000)/1000);
    }
    var scores = [];
    for (var i=mn; i < mx+1; i++){
	scores.push({'score':i,'freq':cums[i]})
    }
    return scores;
}

genNormal = function(n){
    var z = new Ziggurat();
    var rnorm = [];
    for(i=0; i<n; i++){
	rnorm.push(z.nextGaussian());
    }
    return rnorm;
}

simScores = function(persons,items){
    // add some noise
    var scores = [];
    for (i=0; i<persons.length; i++){
	scores.push(0);
	for (j=0; j<items.length; j++){
	    abi = persons[i] + (5 - Math.random()*10)
	    var p = raschP(abi,items[j])
	    var c = correct(p)
	    scores[i]+=c;
	}
    }
    return scores;

    function raschP(b, d){
	return Math.exp(b-d) / (1 + Math.exp(b-d))
    }

    function correct(p){
	return(Math.random() < p ? 1 : 0);
    }
}

grader = function(f){
    return 10 - d3.bisect(cumBnds.sort(),f);
}

simGrades = function(scores,n){
    var cums = genSet(scores,0,n);
    freqs = [];
    for (var i=0; i<scores.length; i++){
	freqs.push(cums[scores[i]].freq)
    }
    //grade
    var grades = freqs.map(grader)
    return grades;
}

Template.example.rendered = function(){
    var self = this;
    self.node = self.find("svg");
    if (!self.handle){
	self.handle = Deps.autorun(function() {
	    var items = Session.get('ni')
	    freq = genSet(scores,0,items);
	    drawBarChart('#example',freq);
	});
    }
}

Template.vadded.rendered = function(){
    var self = this;
    self.node = self.find("svg");
    if (!self.handle){
	self.handle = Deps.autorun(function() {
	    drawPointChart('#vadded',va);
	});
    }
}


Template.control.passing = function () {
    return formatPercent(1-Session.get('pass'));
};

Template.control.fp = function () {
    return formatPercent(Session.get('fp')/Session.get('sims'));
};

Template.control.events({
    'click #regen' : function (evt) {
	// template data, if any, is available in 'this'
	if (typeof console !== 'undefined'){
	    //reset();
	    //redraw();
	    evt.target.value = 'Start';
	    if(Session.get("running")){
		Meteor.clearInterval(simInt);
		
		Session.set("running", false);
	    } else {
		evt.target.value = 'Start';
		simInt = Meteor.setInterval(resetRedraw,1000);
		Session.set("running", true);
	    }
	}
    },
    'click #harder': function () {
	var ps = Session.get('pass');
	if (ps<0.9){
	    Session.set('fp',0);
	    Session.set('sims',0);
	    Session.set('pass', ps+0.05);
	    //Regrade
	    grade();
	    //Redraw
	    redraw();
	}
    },
    'click #easier': function () {
	var ps = Session.get('pass');
	if (ps>0.1){
	    Session.set('fp',0);
	    Session.set('sims',0);
	    Session.set('pass', ps-0.05);	    
	    //Regrade
	    grade();
	    //Redraw
	    redraw();
	}
    }
    
});


var formatPercent = d3.format(".0%");

function grade(){
    //Draw new grade boundaries
    cumBnds = genGrades(Session.get('pass'));
    //Regrade candidates
    //Grade scores
    var n = Session.get('ni')
    grades = simGrades(scores, n);
    //Simulate baseoine
    valueAdded();
}

function valueAdded(){
    //lit into schools
    va = [];
    diff = [];
    
    for(var i=0; i<grades.length; i++){
	diff.push(grades[i]-bGrades[i]);
    }

    var ava = d3.mean(diff);
//    console.log(ava);
    
    var i,j,temparray,chunk = 50;
    for (i=0,j=grades.length; i<j; i+=chunk) {
	temparray = (grades.slice(i,i+chunk));
	basearray = (bGrades.slice(i,i+chunk));
	mn = d3.mean(temparray) - d3.mean(basearray) - ava;
	if(mn < -0.5){Session.set("fp",Session.get("fp")+1)}
	va.push(Math.round(mn*1000)/1000);
    }
    Session.set("sims",Session.get("sims")+va.length);
}

function redraw() {
    svg.selectAll(".bar")
	.data(freq)
	.transition()
	.duration(1000)
	.attr("y", function(d) { return y(d.freq); })
	.attr("height", function(d) { return height - y(d.freq) ; })
    	.style("fill", function(d) {return color(d3.bisectLeft(cumBnds.sort(),d.freq))});

    psvg.selectAll(".point")
	.data(va)
	.transition()
	.duration(1000)
	.attr("cy", function(d) { return py(d); })
	.style("fill", function(d) {return d< -0.5 ? "red" : "steelblue"});

}

function genGrades(ps){
    var inc = (1 - ps)/9;
    var cumBnds = [1,1-ps];
    
    for (var i=2; i<11; i++){
	var stp = cumBnds[i-1]-inc;
	stp = Math.round(stp * 10000) / 10000;
	cumBnds.push(stp);
    }
    return cumBnds;
}

reset = function(){
    var p = Session.get('n');
    var n = Session.get('ni');
    //Session.set('pass',0.1);
    //Set cumulative grades boundaries
    cumBnds = genGrades(Session.get('pass'));
    //Simulate persons
    persons = genNormal(p);
    //Simulate items
    items = genNormal(n);
    //Simulate scores
    scores = simScores(persons, items);
    freq = genSet(scores,0,n);
    //Simulate baseline
    bScores = simScores(persons, items);
    bGrades = simGrades(bScores, n);

    grade();
}


resetRedraw = function(){
    reset();
    redraw();
}

Meteor.startup(function () {
    //Meteor.setInterval(reset,1000);
    Session.set("n",1000);
    Session.set("ni",50);
    Session.set("fp",0);
    Session.set("sims",0);
    Session.set("pass",0.1);
    reset();
    Session.set("running",true);
    simInt = Meteor.setInterval(resetRedraw,1000);
});



