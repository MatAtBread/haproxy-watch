"use nodent";

var mailer = require('nodemailer') ;
var config = require('./watch.json') ;
var http = require('nodent')(use:['http']) ;

function pollProxy() {
	body <<= http.get(config.proxyUrl) ;
	var r = body.split('\n') ;
	for (var i=0; i<r.length; i++) {
		var s = r.split(',') ;
		if (s[]=='DOWN') {
		}
	}
}

module.export = {
	start:function(){
		setInterval(pollProxy,config.poll*1000) ;
	}
}
