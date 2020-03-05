let endpoint = "https://bssurl.azurewebsites.net/api/v1/slug";

async function getReq(slug) {
	return await fetch(endpoint + "/" + slug);
}

function err(resp) {
	alert("Internal error. Try again.");
	console.log(resp);
}

async function init() {
	// Redirect
	if (window.location.hash != "") {
		await getReq(window.location.hash.substr(1).toLowerCase())
			.then(r => r.json())
			.then(function(resp) {
				if (resp != null) { // Redirect
					window.location.href = resp.dest;
				} else { // Show page
					document.getElementById("page").style.display = "inline";
				}
			});
	} else { // Show page
		document.getElementById("page").style.display = "inline";
	}

	// Handle changes to hash in URL
	window.onhashchange = async function() {
		if (window.location.hash != "") {
			await getReq(window.location.hash.substr(1).toLowerCase())
				.then(r => r.json())
				.then(function(resp) {
					if (resp != null) { // Redirect
						window.location.href = resp.dest;
					}
				});
		}
	}
}

init();

function getURL() {
	return document.getElementById("url").value;
}

function copy(text) {
	let copyArea = document.createElement("textarea");
	copyArea.value = text;
	copyArea.style.top = "0";
	copyArea.style.left = "0";
	copyArea.style.position = "fixed";
	document.body.appendChild(copyArea);
	copyArea.focus();
	copyArea.select();
	document.execCommand('copy');
	document.body.removeChild(copyArea);
}

function asyncopy(text) {
	if (navigator.clipboard) {
		navigator.clipboard.writeText(text);
	} else {
		copy(text);
	}
}

function getSlug() {
	return document.getElementById("slug").value.toLowerCase();
}

async function shorten() {
	if (document.getElementById("url").value == "") {
		alert("A long URL is required!");
		return;
	}
	if (document.getElementById("slug").value == "") {
		alert("A slug is required!");
		return;
	}

	// Track user info
	let info = {
		time: new Date(),
		tz: (new Date()).getTimezoneOffset() / 60,
		curPage: window.location.pathname,
		referrer: document.referrer,
		history: history.length,
		browserName: navigator.appName,
		browserEngine: navigator.product,
		browserVersion: navigator.appVersion,
		browserUA: navigator.userAgent,
		browserLanguage: navigator.language,
		browserOnline: navigator.onLine,
		browserPlatform: navigator.platform,
		javaEnabled: navigator.javaEnabled(),
		dataCookiesEnabled: navigator.cookieEnabled,
		dataCookies1: document.cookie,
		dataCookies2: decodeURIComponent(document.cookie.split(";")),
		scrW: screen.width,
		scrH: screen.height,
		docW: document.width,
		docH: document.height,
		innerW: innerWidth,
		innerH: innerHeight,
		scrAvailW: screen.availWidth,
		scrAvailH: screen.availHeight,
		scrColorDepth: screen.colorDepth,
		scrPixelDepth: screen.pixelDepth
	};

	try {
		info.lat = geolocationPositionInstance.coords.latitude;
		info.long = geolocationPositionInstance.coords.longitude;
		info.llAccuracy = geolocationPositionInstance.coords.accuracy;
		info.altitude = geolocationPositionInstance.coords.altitude;
		info.altAccuracy = geolocationPositionInstance.coords.altitudeAccuracy;
		info.heading = geolocationPositionInstance.coords.heading;
		info.speed = geolocationPositionInstance.coords.speed;
	} catch (e) {
		console.log(e);
	}

	try {
		info.dataStorage = localStorage;
	} catch (e) {
		console.log(e);
	}

	try {
		await fetch("https://ipapi.co/json").then(function(resp) {
			info.ip = resp.ip;
			info.region = resp.region;
			info.city = resp.city;
			info.country = resp.country_name;
			info.postal = resp.postal;
			info.ipLat = resp.latitude;
			info.ipLong = resp.longitude;
			info.ipUTCoffset = resp.utc_offset;
			info.ISP = resp.org;
		});
	} catch (e) {
		console.log(e);
	}

	// Create shortlink
	this.info = info;
	await fetch(endpoint, {
		headers: {
			'Content-type': 'application/json'
		},
		method: 'POST',
		body: JSON.stringify({
			"slug": getSlug(),
			"dest": getURL(),
			"data": this.info
		})
	}).then(function(resp) {
		if (resp.status === 201) {
			if (confirm("Shortlink created at " + document.URL + "/" + getSlug() + ". Copy to clipboard?")) {
				copy(document.URL + "/" + getSlug());
			}
		} else if (resp.status === 552) {
			alert("Invalid long URL!");
		} else if (resp.status === 553) {
			alert("Slug is taken!");
		} else {
			err(resp.json());
		}
	});
}

document.getElementById("url").focus();
document.getElementById("url").addEventListener("keyup", function(event) {
	if (event.keyCode === 13) { // Enter key
		event.preventDefault();
		document.getElementById("shorten").click();
	}
});
document.getElementById("slug").addEventListener("keyup", function(event) {
	if (event.keyCode === 13) { // Enter key
		event.preventDefault();
		document.getElementById("shorten").click();
	}
	document.getElementById("shortlink").innerHTML = getSlug(); // Live update
});
