function header() {
	$.ajax({
		url: "https://koanyan5028.github.io/YouTube/header.html",
		cache: false,
		success: function(html){
			let element=document.getElementById("header");
			element.innerHTML=html;
		}
	});
}