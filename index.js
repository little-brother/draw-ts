document.addEventListener("DOMContentLoaded", function(event) { 
	var current;
	var data = [];
	var marks = [];

	var opts = {};
	document.querySelectorAll('[id^="opt-"]').forEach(function (e) {
		var id = e.id.substring(4).replace(/-/g, '_');
		Object.defineProperty(opts, id,
			e.hasAttribute('number') ? {get: () => parseFloat(e.value), set: (value) => e.value = value} :
			e.type == 'checkbox' ? {get: () => e.checked, set: (value) => e.checked = value} :
			{get: () => e.value, set: (value) => e.value = value}
		);

		e.addEventListener('change', () => updateCanvas());
	});
	
	opts.start_date = getDate();
	resizeCanvas();
	jump(0);
		
	window.addEventListener('keydown', function (event) {
		var keyCode = event.keyCode || event.detail;

		// Del: Clear current chart
		if (keyCode == 46) {
			data[current] = []; 
			marks[current] = [];
			updateCanvas();
		}

		// Space: Set current screen as background
		if (keyCode == 32) {
			var _canvas = document.createElement('canvas');
			_canvas.width = canvas.width;
			_canvas.height = canvas.height;
			
			drawData(_canvas.getContext('2d'), current, 'rgba(0, 0, 255, 0.2)');

			_canvas.toBlob(function (blob) {
				canvas.style.backgroundImage = 'url(' + URL.createObjectURL(blob) + ')'
				_canvas.remove();
			});
		}
			
		// I: upload background image
		if (keyCode == 73) 
			upload.click();
		
		// U: remove background image
		if (keyCode == 85)
			canvas.style.backgroundImage = '';

		// O: Show option 
		if (keyCode == 79)
			 option.style.display = 'block';

		// W: Show export option 
		if (keyCode == 87) 
			window['export-option'].style.display = 'block';
			 
		// Q: Export data 
		if (keyCode == 81)
			 exportData();

		// Esc: Hide menu and dialogs
		if (keyCode == 27) {
			option.style.display = 'none';
			window['export-option'].style.display = 'none';
			menu.style.display = 'none';
		}

		// <-: jump to prev
		if (keyCode == 37)
			jump(current - 1);

		// ->: jump to next 
		if (keyCode == 39)
			jump(current + 1);
	});
	window.addEventListener('resize', resizeCanvas);
	window.addEventListener('contextmenu', showMenu, false);
	window.addEventListener('click', (event) => window.dispatchEvent(new CustomEvent('keydown', {detail: 27})));

	document.querySelectorAll('.dialog').forEach(function (e) {
		e.addEventListener('click', (event) => event.stopPropagation());
		e.addEventListener('keydown', (event) => event.stopPropagation());
	});

	prev.addEventListener('click', () => jump(current - 1));
	next.addEventListener('click', () => jump(current + 1));
	upload.addEventListener('change', () => canvas.style.backgroundImage = 'url(' + URL.createObjectURL(upload.files[0]) + ')', true);

	menu.addEventListener('click', function (event) {
		menu.style.display = 'none';

		var keyCode = event.target.getAttribute('code') || event.target.querySelector('.key').getAttribute('code');
		window.dispatchEvent(new CustomEvent('keydown', {detail: keyCode}));

		event.stopPropagation(); 
		return false;
	}, false);
	

	canvas.addEventListener('mousemove', (event) => (event.buttons & 1) ? addElement(event) : null, false);
	canvas.addEventListener('click', (event) => addElement(event), false);

	function addElement(event) {
		var x = Math.round((event.clientX - canvas.offsetLeft) / opts.sensitivity) * opts.sensitivity;
		var y = event.clientY - canvas.offsetTop;
		
		if (data[current][x] != undefined && data[current][x] != y)
			delete marks[current][x];

		if (event.ctrlKey &&  marks[current][x] == undefined)
			marks[current][x] = y;

		data[current][x] = y;
	 	updateCanvas();
	}

	function jump(to) {
		current = to;
		if (!data[to]) {
			data[to] = [];
			marks[to] = [];
		}

		updateCanvas();
	}

	function updateCanvas() {
		var w = canvas.width;
		var h = canvas.height;

		var ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, w, h);

		ctx.fillStyle = '#00000030';
		ctx.strokeStyle = '#eee';
		ctx.font = '14px Arial';

		ctx.beginPath();		
		for (var i = 1; i < 10; i++) {
			ctx.moveTo(0, i * h / 10);
			ctx.lineTo(w, i * h / 10); 
			if ( i != 5) {
				var label = opts.min + (10 - i) * (opts.max - opts.min)/10
				ctx.fillText(label, w - ctx.measureText(label).width - 10, i * h / 10 - 5); 
				ctx.fillText(label, 10, i * h / 10 - 5); 
			}
		}

		var vlength = {hour: 12, day: 24, week: 7}[opts.duration];
		for (var i = 1; i < vlength; i++) {
			ctx.moveTo(i * w / vlength, 0);
			ctx.lineTo(i * w / vlength, h); 
		}
		ctx.closePath();
	    ctx.stroke();		

		var time = new Date(opts.start_date).getTime();
		var hour = 1000 * 60 * 60;	

		var drawXLabel = (arr) => arr.forEach((e, i) => ctx.fillText(e, (i + 0.5)* w / arr.length - ctx.measureText(e).width / 2, 25))

		if (opts.duration == 'hour') {
			ctx.font = '30px Arial';
			ctx.fillText(getDate(time + 24 * hour * Math.floor(current / 24)), w - 160, h - 35); 
			ctx.font = '20px Arial';
			ctx.fillText(getTime(time + hour * current) + ' - '+ getTime(time + hour * (current + 1)), w - 140, h - 15); 

			drawXLabel(['0 - 5', '5 - 10', '10 - 15', '15 - 20', '20 - 25', '25 - 30', '30 - 35', '35 - 40', '40 - 45', '45 - 50', '50 - 55', '55 - 60']);
		}

		if (opts.duration == 'day') {
			ctx.font = '30px Arial';
			ctx.fillText(getDate(time + current * hour * 24), w - 160, h - 20); 

			ctx.font = '20px Arial';
			drawXLabel([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24]);
		}
		
		if (opts.duration == 'week') {
			ctx.font = '20px Arial';
			ctx.fillText(getDate(time + 7 * current * hour * 24) + ' - ' + getDate(time + 7 * current * hour * 24 + 6 * hour * 24), w - 230, h - 20); 

			var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
			var curr = new Date(opts.start_date).getDay() - 1;
			days = days.slice(curr, 7).concat(days.slice(0, curr));
			drawXLabel(days);	
		}

		drawData(ctx, current, '#000');
		drawMarks(ctx, current);
	}

	function resizeCanvas() {
		canvas.width = window.innerWidth - 22;
		canvas.height = window.innerHeight - 28;
		updateCanvas();
	}

	function showMenu(event) {
		menu.style.display = 'block';
		menu.style.left = event.clientX + 'px';
		menu.style.top = event.clientY + 'px';
		event.preventDefault();
		return false;
	}

	function drawData (ctx, i, color) {
		if (!data[i] || !data[i].length)
			return;

		ctx.strokeStyle = color;	
		ctx.beginPath();		
		for (var time in data[i]) {
			ctx.lineTo(time, data[i][time]);
			ctx.moveTo(time, data[i][time]);
		}
		ctx.closePath();
	    ctx.stroke();	  
	}

	function drawMarks(ctx, i) {
		ctx.fillStyle = 'blue';
		ctx.beginPath();
		for (var time in marks[i]) {
			ctx.moveTo(time, marks[i][time]);
			ctx.arc(time, marks[i][time], 3, 0, 2 * Math.PI, false);
		}
		ctx.closePath();
		ctx.fill();
	}

	function exportData () {
		var hour = 1000 * 60 * 60;
		var duration = {hour, day: hour * 24, week: hour * 24 * 7}[opts.duration];
		var begin_time = new Date(opts.start_date).getTime() - new Date().getTimezoneOffset() * hour / 60;

		var res = [];
		for (var i in data) { // because forEach skipps negative indexes
			if (opts.only_current && i != current)
				continue;

			var _marks = {};
			for (var time in marks[i])
				_marks[time] = true;

			for(var time in data[i]) {
				var value = parseFloat((canvas.height - data[i][time]) * (opts.max - opts.min) / canvas.height + opts.min);
				var e = [Math.floor(begin_time + i * duration + duration * time / canvas.width), Math.min(value, opts.max)];
				if (_marks[time]) 
					e.push(1);
				res.push(e);
			}
		}	
		res.sort((a, b) => a[0] - b[0]);

		if (!res.length)
			return;

		if (opts.datetime_format == 'string')
			res.forEach((e) => e[0] = getDate(e[0]) + ' ' + getTime(e[0]));

		if (opts.round > - 1)
			res.forEach((e) => e[1] = parseFloat(e[1].toFixed(opts.round)));

		var text = '';
		var type = 'application/json';
		var ext = 'json';

		if (opts.export_format == 'json')
			text = JSON.stringify(res);

		if (opts.export_format == 'json2')
			text = JSON.stringify({
				times: res.map((e) => e[0]), 
				values: res.map((e) => e[1]),
				marks: res.filter((e) => !!e[2]).map((e) => e[0])
			});

		if (opts.export_format == 'csv') {
			text = res.map((e) => e.join(',')).join('\n');
			type = 'text/csv';
			ext = 'csv';
		}

		var uploader = window.document.createElement('a');
		uploader.href = URL.createObjectURL(new Blob([text], {type}));
		uploader.download = 'data.' + ext;
		
		document.body.appendChild(uploader);
		uploader.click();
		uploader.remove();
	}

	function getTime(time) {
		var date = time ? new Date(time) : new Date();
		return (date.getHours() + '').padStart(2, 0) + ':' + (date.getMinutes() + '').padStart(2, 0)
	}
	
	function getDate(time) {
		var date = time ? new Date(time) : new Date();
		return date.getFullYear() + '/' + (date.getMonth() + 1 + '').padStart(2, 0) + '/' + (date.getDate() + '').padStart(2, 0);
	}
});