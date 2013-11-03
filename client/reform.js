drawBarChart = function(div, data){
    margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

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
	.attr("height", function(d) { return height - y(d.freq); })
	.style("fill", function(d) {return color(d3.bisectLeft(cumBnds,d.freq))});

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
	cums.push((cums[i]-(obj[i]/n)).toFixed(3));
    }
    var scores = [];
    for (var i=mn; i < mx+1; i++){
	scores.push({'score':i,'freq':cums[i]})
    }
    return scores;
}

genScores = function(nPersons,nItems){
    var z = new Ziggurat();
    var persons = [];
    for(i=0; i<nPersons; i++){
	persons.push(z.nextGaussian());
    }
    var x = new Ziggurat();
    var items = [];
    for(i=0; i<nItems; i++){
	items.push(x.nextGaussian());
    }
    // generate scores
    var scores = [];
    for (i=0; i<nPersons; i++){
	scores.push(0);
	for (j=0; j<nItems; j++){
	    var p = raschP(persons[i],items[j])
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

Template.example.rendered = function(){
    var self = this;
    self.node = self.find("svg");
    if (!self.handle){
	self.handle = Deps.autorun(function() {
	    var items = Session.get('ni')
	    scores = genScores(Session.get("n"),items);
	    freq = genSet(scores,0,items);
	    drawBarChart('#example',freq);
	});
    }
}

Template.hello.greeting = function () {
    return "Welcome to reform.";
};

Template.hello.events({
    'click input' : function () {
	// template data, if any, is available in 'this'
	if (typeof console !== 'undefined'){
	    regen(Session.get('n'),Session.get('ni'));
	}
    }
});

function regen(n,i){
    scores = genScores(n,i)
    freq = genSet(scores,0,i)
    redraw();
}

function redraw() {
    svg.selectAll(".bar")
	.data(freq)
	.transition()
	.duration(1000)
	.attr("y", function(d) { return y(d.freq); })
	.attr("height", function(d) { return height - y(d.freq); })
    	.style("fill", function(d) {return color(d3.bisectLeft(cumBnds,d.freq))});
}

Meteor.startup(function () {
    Session.set('n',1000);
    Session.set('ni',50);
    cumBnds = [0,.1,.2,.3,.4,.5,.6,.7,.8,.9,1];
    //Meteor.setInterval(regen(Session.get('n')), 1000);
});

