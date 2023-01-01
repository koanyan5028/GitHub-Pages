function header() {
	$.ajax({
		url: "header.html",
		cache: false,
		success: function(html) {
			let element=document.getElementById("header");
			console.log(html)
			element.write(html);
		}
	});
}