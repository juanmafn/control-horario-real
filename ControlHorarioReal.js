// ==UserScript==
// @name         Control horario correcto
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Añade la hora buena teniendo en cuenta el cerdito
// @author       You
// @match        https://intranet.iti.upv.es/iti-hrm/controlhorario/
// @grant        none
// ==/UserScript==

function getDiferenciaEnSegundos() {
    let horaFinalDiaHtml = $($('h3.no-margins')[3]).html();

	let horaFinalDia = horaFinalDiaHtml.match(/-?\d+:\d+/)[0];

	let h = +horaFinalDia.match(/(\d+):/)[1];
	let m = +horaFinalDia.match(/:(\d+)/)[1];

	let d1 = new Date(2019, 1, 1, 0, 0);
	let d2 = new Date(2019, 1, 1, h, m);

	let signo = horaFinalDia.indexOf('-') >= 0 ? -1 : 1;

	let s = (d2.getTime() - d1.getTime()) / 1000 * signo;

	return s;
}

function getSegundosConsumidosCerdito() {
	let numDiasTrabajados = $('td').filter(x => /\d{2}\/\d{2}\/\d{4}.*?[a-zA-Z]/.test($('td')[x].innerText.replace("\n", ""))).length;
	return numDiasTrabajados * 0.5 * 3600;
}

function getStringDiferencia(segundos) {
	let negativo = segundos < 0;
	if (negativo) segundos *= -1;
	let h = parseInt(segundos / 3600);
	let m = parseInt((segundos % 3600) / 60);
	if (m < 10) m = "0" + m;
	let horaString = (negativo ? '-' : '+') + h + ':' + m;
	return '<span style="color: ' + (negativo ? 'red' : 'green') + ';">' + horaString + '</span>';
}

function getHtmlDiferencia() {
	let diferenciaEnSegundos = getDiferenciaEnSegundos();
	let segundosConsumidosCerdito = getSegundosConsumidosCerdito();
	let diferenciaRealEnSegundos = diferenciaEnSegundos + segundosConsumidosCerdito;
	return getStringDiferencia(diferenciaEnSegundos) + '<br>' + getStringDiferencia(diferenciaRealEnSegundos);
}

function setHoraCorrecta() {
	let htmlDiferencia = getHtmlDiferencia();
	$($('h3.no-margins')[3]).html(htmlDiferencia);
}

(function() {
    'use strict';
    setHoraCorrecta();
})();
