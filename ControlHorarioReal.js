// ==UserScript==
// @name         Control horario correcto
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Añade la hora buena teniendo en cuenta el cerdito
// @description  Para que funcione debes navegar a la vista mensual
// @author       Juanma
// @match        https://intranet.iti.upv.es/iti-hrm/controlhorario/
// @grant        none
// ==/UserScript==

/*** Utils ***/
function getHoraStringFromHtml(horaHtml) {
	return horaHtml.match(/-?\d+:\d+/)[0];
}

function getSegundosFromHoraString(horaString) {
	let h = +horaString.match(/(\d+):/)[1];
	let m = +horaString.match(/:(\d+)/)[1];

	let d1 = new Date(2019, 1, 1, 0, 0);
	let d2 = new Date(2019, 1, 1, h, m);

	let signo = horaString.indexOf('-') >= 0 ? -1 : 1;

	return (d2.getTime() - d1.getTime()) / 1000 * signo;
}

function getHoraHtmlFromSegundos(segundos, conColor) {
	let negativo = segundos < 0;
	if (negativo) segundos *= -1;
	let h = parseInt(segundos / 3600);
	let m = parseInt((segundos % 3600) / 60);
	if (m < 10) m = "0" + m;
	let horaString = (negativo ? '-' : '+') + h + ':' + m;
	let colorStyle = conColor ? ' style="color: ' + (negativo ? 'red' : 'green') + ';"' : '';
	horaString = conColor ? horaString : horaString.replace('+', '').replace('-', '');
	return '<span' + colorStyle + '>' + horaString + '</span>';
}

function getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos) {
	return getHoraHtmlFromSegundos(diferenciaEnSegundos, true) + '<br>' + getHoraHtmlFromSegundos(diferenciaRealEnSegundos, true);
}

function getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito) {
	return getHoraHtmlFromSegundos(saldoCerditoEnSegundos, false) + '<br>' + getHoraHtmlFromSegundos(-segundosConsumidosCerdito, true);
}
/*** ----------------------------------------------- ***/

/*** Web scraping - recolectando datos ***/
function getDiferenciaEnSegundos() {
    let horaFinalDiaHtml = $($('h3.no-margins')[3]).html();
	let horaFinalDia = getHoraStringFromHtml(horaFinalDiaHtml);
	return getSegundosFromHoraString(horaFinalDia);
}

function getSaldoCerditoEnSegundos() {
    let horasSaldoCerditoHtml = $($('h3.no-margins')[6]).html();
	let horasSaldoCerdito = getHoraStringFromHtml(horasSaldoCerditoHtml);
	return getSegundosFromHoraString(horasSaldoCerdito);
}

function getNumDiasTrabajados() {
	let tdsDias = $('td').filter(x => /\d{2}\/\d{2}\/\d{4}.*?[a-zA-Z]/.test($('td')[x].innerText.replace("\n", "")));
	let numDiasTrabajados = tdsDias.filter(x => tdsDias[x].parentElement.children[2].innerText === 'Entrar ITI').length;
	return numDiasTrabajados;
}

function getSegundosConsumidosCerdito(saldoCerditoEnSegundos) {
	let numDiasTrabajados = getNumDiasTrabajados();
	let segundosConsumidosCerdito = numDiasTrabajados * 0.5 * 3600;
	if (segundosConsumidosCerdito > saldoCerditoEnSegundos) {
		segundosConsumidosCerdito = saldoCerditoEnSegundos;
	}
	return segundosConsumidosCerdito;
}

function setHoraDiferenciaCorrecta(htmlDiferenciaReal) {
	$($('h3.no-margins')[3]).html(htmlDiferenciaReal);
}

function setHoraSaldo(htmlHoraSaldo) {
	$($('h3.no-margins')[6]).html(htmlHoraSaldo);
}
/*** ----------------------------------------------- ***/

function main() {
	let diferenciaEnSegundos = getDiferenciaEnSegundos();
	let saldoCerditoEnSegundos = getSaldoCerditoEnSegundos();
	let segundosConsumidosCerdito = getSegundosConsumidosCerdito(saldoCerditoEnSegundos);
	let diferenciaRealEnSegundos = diferenciaEnSegundos + segundosConsumidosCerdito;
	let htmlDiferenciaReal = getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos);
	let htmlHorasSaldo = getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito);
	setHoraDiferenciaCorrecta(htmlDiferenciaReal);
	setHoraSaldo(htmlHorasSaldo);
}

(function() {
    'use strict';
    main();
})();
