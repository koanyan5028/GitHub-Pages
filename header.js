function header() {
	$.ajax({
		url: "header.html",
		cache: false,
		success: function(html){
			console.log(html)
			let element=document.getElementById("header");
			element.innerHTML=html;
		}
	});
}