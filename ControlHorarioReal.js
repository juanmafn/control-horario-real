// ==UserScript==
// @name         Control horario correcto
// @namespace    http://tampermonkey.net/
// @version      0.8
// @description  Debajo de las horas normales añado las horas teniendo en cuenta la jornada intensiva
// @author       Juanma
// @match        https://intranet.iti.upv.es/iti-hrm/controlhorario/
// @grant        none
// ==/UserScript==


/*** Utils ***/

function getHoraStringFromHtml(horaHtml) {
	return horaHtml.match(/-?\d+:\d+/)[0];
}

function getSegundosFromHoraString(horaString) {
	const h = +horaString.match(/(\d+):/)[1];
	const m = +horaString.match(/:(\d+)/)[1];

	const d1 = new Date(2019, 1, 1, 0, 0);
	const d2 = new Date(2019, 1, 1, h, m);

	const signo = horaString.indexOf('-') >= 0 ? -1 : 1;

	return (d2.getTime() - d1.getTime()) / 1000 * signo;
}

function getHoraHtmlFromSegundos2(segundos, conColor, conSigno) {
	const negativo = segundos < 0;
	if (negativo) segundos *= -1;
	const h = parseInt(segundos / 3600);
	let m = parseInt((segundos % 3600) / 60);
	if (m < 10) m = "0" + m;
	let horaString = (negativo ? '-' : '+') + h + ':' + m;
	const colorStyle = conColor ? ' style="color: ' + (negativo ? 'red' : 'green') + ';"' : '';
	horaString = conSigno ? horaString : horaString.replace('+', '').replace('-', '');
	return '<span' + colorStyle + '>' + horaString + '</span>';
}

function getHoraHtmlFromSegundos(segundos, conColor, conSigno, mostrarSegundos) {
	const negativo = segundos < 0;
    let horaString = '';
	if (negativo) segundos *= -1;
	const h = parseInt(segundos / 3600);
	segundos %= 3600;
	let m = parseInt(segundos / 60);
    if (segundos < 60 && mostrarSegundos) {
        if (segundos < 10) segundos = "0" + segundos;
        horaString = (negativo ? '-' : '+') + '0:00:' + parseInt(segundos);
    } else {
		segundos %= 60;
        if (segundos > 30) m++;
        if (m < 10) m = "0" + m;
        horaString = (negativo ? '-' : '+') + h + ':' + m;
    }
    const colorStyle = conColor ? ' style="color: ' + (negativo ? 'red' : 'green') + ';"' : '';
    horaString = conSigno ? horaString : horaString.replace('+', '').replace('-', '');
    return '<span' + colorStyle + '>' + horaString + '</span>';
}

/*** ----------------------------------------------- ***/


/*** Web scraping - recolectando datos ***/

function getCabecerasDOM() {
	return $('h3.no-margins');
}

function getHorasEstipuladasEnSegundos() {
	const horasEstipuladasHtml = $(getCabecerasDOM()[1]).html();
	const horasEstipuladas = getHoraStringFromHtml(horasEstipuladasHtml);
	return getSegundosFromHoraString(horasEstipuladas);
}

function getHorasEstipuladasAlFinalDelDiaEnSegundos() {
	const horasEstipuladasFinalDelDiaHtml = $(getCabecerasDOM()[2]).html();
	const horasEstipuladasFinalDelDia = getHoraStringFromHtml(horasEstipuladasFinalDelDiaHtml);
	return getSegundosFromHoraString(horasEstipuladasFinalDelDia);
}

function getDiferenciaEnSegundos() {
	const horaFinalDiaHtml = $(getCabecerasDOM()[3]).html();
	const horaFinalDia = getHoraStringFromHtml(horaFinalDiaHtml);
	return getSegundosFromHoraString(horaFinalDia);
}

function getDiasLaborablesRestantes() {
	return +$(getCabecerasDOM()[4]).html().trim();
}

function getHorasAlDiaHastaFinDeMesEnSegundos() {
	const horasAlDiaHtml = $(getCabecerasDOM()[9]).html().trim();
    if (horasAlDiaHtml == '-') return '-';
	const horasAlDia = getHoraStringFromHtml(horasAlDiaHtml);
	return getSegundosFromHoraString(horasAlDia);
}

function getSaldoCerditoEnSegundos() {
	const horasSaldoCerditoHtml = $(getCabecerasDOM()[10]).html();
	const horasSaldoCerdito = getHoraStringFromHtml(horasSaldoCerditoHtml);
	return getSegundosFromHoraString(horasSaldoCerdito);
}

function getSegundosConsumidosCerdito(saldoCerditoEnSegundos, numDiasTrabajados, descuentoSegundosCerditoAlDia) {
	let segundosConsumidosCerdito = numDiasTrabajados * descuentoSegundosCerditoAlDia;
	if (segundosConsumidosCerdito > saldoCerditoEnSegundos) {
		segundosConsumidosCerdito = saldoCerditoEnSegundos;
	}
	return segundosConsumidosCerdito;
}

function setHorasEstipuladas(htmlHorasEstipuladas) {
	$(getCabecerasDOM()[1]).html(htmlHorasEstipuladas);
}

function setHoraEstipuladaAlFinalDelDiaCorrecta(htmlHorasEstipuladasAlFinalDelDia) {
	$(getCabecerasDOM()[2]).html(htmlHorasEstipuladasAlFinalDelDia);
}

function setHoraDiferenciaCorrecta(htmlDiferenciaReal) {
	$(getCabecerasDOM()[3]).html(htmlDiferenciaReal);
}

function setHorasAlDia(htmlHorasAlDia) {
	$(getCabecerasDOM()[9]).html(htmlHorasAlDia);
}

function setHoraSaldo(htmlHoraSaldo) {
	$(getCabecerasDOM()[10]).html(htmlHoraSaldo);
}

function setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia) {
	const descuentoHorasCerditoAlDia = getHoraHtmlFromSegundos(descuentoSegundosCerditoAlDia, false, false, true);
	const horasXDia = getHoraHtmlFromSegundos(segundosXDia, false, false);
	$($('.row.nopadding.widgets')[0]).after(`
		<div class="row nopadding widgets">
			<div class="col-md-12" style="padding-right: 7px;">
				<div class="ibox float-e-margins">
				<div class="ibox-title">
					<h5>
					Aclaración
					</h5>
				</div>
				<div class="ibox-content">
					<div class="row">
					<div class="col-xs-12">
						<h3 class="no-margins">
							Cada día se descuentan <strong>${descuentoHorasCerditoAlDia}</strong> horas del cerdito, por lo tanto debes trabajar <strong>${horasXDia}</strong> horas al día
						</h3>
					</div>
					</div>
				</div>
				</div>
			</div>
		</div>
	`)
}

/*** ----------------------------------------------- ***/


/*** Lógica ***/

function esEpocaDeJornadaIntensiva() {
	const hoy = new Date();
	return [6, 7].includes(hoy.getMonth());
}

function getDiasLaborables(horasEstipuladasEnSegundos) {
	return horasEstipuladasEnSegundos / (7.5 * 3600);
}

function getSegundosARestarParaJornadaIntensiva(diasLaborables, saldoCerditoEnSegundos) {
	let segundosARestarParaJornadaIntensiva = diasLaborables * 0.5 * 3600;
	if (segundosARestarParaJornadaIntensiva > saldoCerditoEnSegundos) {
		segundosARestarParaJornadaIntensiva = saldoCerditoEnSegundos;
	}
	return segundosARestarParaJornadaIntensiva;
}

function getHtmlHorasEstipuladas(horasEstipuladasEnSegundos, segundosEstipiladosEnJornadaIntensiva) {
	return getHoraHtmlFromSegundos(horasEstipuladasEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(segundosEstipiladosEnJornadaIntensiva, false, false);
}

function getHtmlHorasEstipuladasAlFinalDelDia(horasEstipuladasAlFinalDelDiaEnSegundos, diasTrabajados, segundosXDia) {
	return getHoraHtmlFromSegundos(horasEstipuladasAlFinalDelDiaEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(diasTrabajados * segundosXDia, false, false);
}

function getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos) {
	return getHoraHtmlFromSegundos(diferenciaEnSegundos, true, true) + '<br>' + getHoraHtmlFromSegundos(diferenciaRealEnSegundos, true, true);
}

function getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos, diferenciaEnSegundos) {
    const horasAlDiaHastaFinDeMesEnSegundos = getHorasAlDiaHastaFinDeMesEnSegundos();
    if (horasAlDiaHastaFinDeMesEnSegundos == '-') {
        return getHoraHtmlFromSegundos(-diferenciaEnSegundos, false, true) + '<br>' + getHoraHtmlFromSegundos(-diferenciaRealEnSegundos, false, true);
    }
	const segundosAcumulados = diferenciaRealEnSegundos / diasLaborablesRestantes;
	const segundosDia = segundosXDia - segundosAcumulados;
	const htmlHorasAlDia = getHoraHtmlFromSegundos(horasAlDiaHastaFinDeMesEnSegundos, false, true) + '<br>' + getHoraHtmlFromSegundos(segundosDia, false, true)
	return htmlHorasAlDia;
}

function getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito) {
	return getHoraHtmlFromSegundos(saldoCerditoEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(-segundosConsumidosCerdito, true, true);
}

/*** ----------------------------------------------- ***/

function main() {
	// Datos extraidos
	const horasEstipuladasEnSegundos = getHorasEstipuladasEnSegundos();
	const horasEstipuladasAlFinalDelDiaEnSegundos = getHorasEstipuladasAlFinalDelDiaEnSegundos();
	const diferenciaEnSegundos = getDiferenciaEnSegundos();
	const diasLaborablesRestantes = getDiasLaborablesRestantes();
	const saldoCerditoEnSegundos = getSaldoCerditoEnSegundos();

	// Datos calculados
	const diasLaborables = getDiasLaborables(horasEstipuladasEnSegundos);
	const segundosARestarParaJornadaIntensiva = getSegundosARestarParaJornadaIntensiva(diasLaborables, saldoCerditoEnSegundos);
	const diasTrabajados = diasLaborables - diasLaborablesRestantes;
	const segundosEstipiladosEnJornadaIntensiva = horasEstipuladasEnSegundos - segundosARestarParaJornadaIntensiva; // Dato modificado
	const descuentoSegundosCerditoAlDia = segundosARestarParaJornadaIntensiva / diasLaborables;
	const segundosXDia = segundosEstipiladosEnJornadaIntensiva / diasLaborables;
	const segundosConsumidosCerdito = getSegundosConsumidosCerdito(saldoCerditoEnSegundos, diasTrabajados, descuentoSegundosCerditoAlDia); // Dato modificado
	const diferenciaRealEnSegundos = diferenciaEnSegundos + segundosConsumidosCerdito; // Dato modificado

	// HTML's modificados
	const htmlHorasEstipuladas = getHtmlHorasEstipuladas(horasEstipuladasEnSegundos, segundosEstipiladosEnJornadaIntensiva);
	const htmlHorasEstipuladasAlFinalDelDia = getHtmlHorasEstipuladasAlFinalDelDia(horasEstipuladasAlFinalDelDiaEnSegundos, diasTrabajados, segundosXDia);
	const htmlDiferenciaReal = getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos);
	const htmlHorasAlDia = getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos, diferenciaEnSegundos);
	const htmlHorasSaldo = getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito);

	// Seteamos los HTML's
	setHorasEstipuladas(htmlHorasEstipuladas);
	setHoraEstipuladaAlFinalDelDiaCorrecta(htmlHorasEstipuladasAlFinalDelDia);
	setHoraDiferenciaCorrecta(htmlDiferenciaReal);
	setHorasAlDia(htmlHorasAlDia);
	setHoraSaldo(htmlHorasSaldo);
	setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia);
}

(function () {
	'use strict';
	if (esEpocaDeJornadaIntensiva()) {
		main();
	}
})();
