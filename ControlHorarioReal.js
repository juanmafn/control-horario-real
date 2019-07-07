// ==UserScript==
// @name         Control horario correcto
// @namespace    http://tampermonkey.net/
// @version      0.4
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
	let h = +horaString.match(/(\d+):/)[1];
	let m = +horaString.match(/:(\d+)/)[1];

	let d1 = new Date(2019, 1, 1, 0, 0);
	let d2 = new Date(2019, 1, 1, h, m);

	let signo = horaString.indexOf('-') >= 0 ? -1 : 1;

	return (d2.getTime() - d1.getTime()) / 1000 * signo;
}

function getHoraHtmlFromSegundos(segundos, conColor, conSigno) {
	let negativo = segundos < 0;
	if (negativo) segundos *= -1;
	let h = parseInt(segundos / 3600);
	let m = parseInt((segundos % 3600) / 60);
	if (m < 10) m = "0" + m;
	let horaString = (negativo ? '-' : '+') + h + ':' + m;
	let colorStyle = conColor ? ' style="color: ' + (negativo ? 'red' : 'green') + ';"' : '';
	horaString = conSigno ? horaString : horaString.replace('+', '').replace('-', '');
	return '<span' + colorStyle + '>' + horaString + '</span>';
}

/*** ----------------------------------------------- ***/


/*** Web scraping - recolectando datos ***/

function getCabecerasDOM() {
	return $('h3.no-margins');
}

function getHorasEstipuladasEnSegundos() {
    let horasEstipuladasHtml = $($('h3.no-margins')[1]).html();
	let horasEstipuladas = getHoraStringFromHtml(horasEstipuladasHtml);
	return getSegundosFromHoraString(horasEstipuladas);
}

function getHorasEstipuladasAlFinalDelDiaEnSegundos() {
	let horasEstipuladasFinalDelDiaHtml = $($('h3.no-margins')[2]).html();
	let horasEstipuladasFinalDelDia = getHoraStringFromHtml(horasEstipuladasFinalDelDiaHtml);
	return getSegundosFromHoraString(horasEstipuladasFinalDelDia);
}

function getDiferenciaEnSegundos() {
    let horaFinalDiaHtml = $(getCabecerasDOM()[3]).html();
	let horaFinalDia = getHoraStringFromHtml(horaFinalDiaHtml);
	return getSegundosFromHoraString(horaFinalDia);
}

function getDiasLaborablesRestantes() {
	return +$(getCabecerasDOM()[4]).html().trim();
}

function getHorasAlDiaHastaFinDeMesEnSegundos() {
    let horasAlDiaHtml = $(getCabecerasDOM()[5]).html();
	let horasAlDia = getHoraStringFromHtml(horasAlDiaHtml);
	return getSegundosFromHoraString(horasAlDia);
}

function getSaldoCerditoEnSegundos() {
    let horasSaldoCerditoHtml = $(getCabecerasDOM()[6]).html();
	let horasSaldoCerdito = getHoraStringFromHtml(horasSaldoCerditoHtml);
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
	$(getCabecerasDOM()[5]).html(htmlHorasAlDia);
}

function setHoraSaldo(htmlHoraSaldo) {
	$(getCabecerasDOM()[6]).html(htmlHoraSaldo);
}

function setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia) {
	let descuentoHorasCerditoAlDia = getHoraHtmlFromSegundos(descuentoSegundosCerditoAlDia, false, false);
	let horasXDia = getHoraHtmlFromSegundos(segundosXDia, false, false);
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

function getNumDiasTrabajados(diasLaborables) {
	return diasLaborables - getDiasLaborablesRestantes();
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

function getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos) {
	let horasAlDiaHastaFinDeMesEnSegundos = getHorasAlDiaHastaFinDeMesEnSegundos();
	let segundosAcumulados = diferenciaRealEnSegundos / diasLaborablesRestantes;
	let segundosDia = segundosXDia - segundosAcumulados;
	let htmlHorasAlDia = getHoraHtmlFromSegundos(horasAlDiaHastaFinDeMesEnSegundos, false, true) + '<br>' + getHoraHtmlFromSegundos(segundosDia, false, true)
	return htmlHorasAlDia;
}

function getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito) {
	return getHoraHtmlFromSegundos(saldoCerditoEnSegundos, false, false) + '<br>' + getHoraHtmlFromSegundos(-segundosConsumidosCerdito, true, true);
}

/*** ----------------------------------------------- ***/

function main() {
	// Datos extraidos
    let horasEstipuladasEnSegundos = getHorasEstipuladasEnSegundos();
    let horasEstipuladasAlFinalDelDiaEnSegundos = getHorasEstipuladasAlFinalDelDiaEnSegundos();
    let diferenciaEnSegundos = getDiferenciaEnSegundos();
    let diasLaborablesRestantes = getDiasLaborablesRestantes();
    let saldoCerditoEnSegundos = getSaldoCerditoEnSegundos();
    
	// Datos calculados
    let diasLaborables = getDiasLaborables(horasEstipuladasEnSegundos);
    let segundosARestarParaJornadaIntensiva = getSegundosARestarParaJornadaIntensiva(diasLaborables, saldoCerditoEnSegundos);
    let diasTrabajados = diasLaborables - diasLaborablesRestantes;
    let segundosEstipiladosEnJornadaIntensiva = horasEstipuladasEnSegundos - segundosARestarParaJornadaIntensiva; // Dato modificado
    let descuentoSegundosCerditoAlDia = segundosARestarParaJornadaIntensiva / diasLaborables;
	let segundosXDia = segundosEstipiladosEnJornadaIntensiva / diasLaborables;
	let segundosEstipuladosAlFinalDelDiaEnJornadaIntensiva = diasTrabajados * segundosXDia;
    let segundosConsumidosCerdito = getSegundosConsumidosCerdito(saldoCerditoEnSegundos, diasTrabajados, descuentoSegundosCerditoAlDia); // Dato modificado
    let diferenciaRealEnSegundos = diferenciaEnSegundos + segundosConsumidosCerdito; // Dato modificado

	// HTML's modificados
	let htmlHorasEstipuladas = getHtmlHorasEstipuladas(horasEstipuladasEnSegundos, segundosEstipiladosEnJornadaIntensiva);
	let htmlHorasEstipuladasAlFinalDelDia = getHtmlHorasEstipuladasAlFinalDelDia(horasEstipuladasAlFinalDelDiaEnSegundos, diasTrabajados, segundosXDia);
	let htmlDiferenciaReal = getHtmlDiferencia(diferenciaEnSegundos, diferenciaRealEnSegundos);
	let htmlHorasAlDia = getHtmlHorasAlDia(segundosXDia, diasLaborablesRestantes, diferenciaRealEnSegundos);
	let htmlHorasSaldo = getHtmlHoraSaldo(saldoCerditoEnSegundos, segundosConsumidosCerdito);

	// Seteamos los HTML's
	setHorasEstipuladas(htmlHorasEstipuladas);
	setHoraEstipuladaAlFinalDelDiaCorrecta(htmlHorasEstipuladasAlFinalDelDia);
	setHoraDiferenciaCorrecta(htmlDiferenciaReal);
	setHorasAlDia(htmlHorasAlDia);
	setHoraSaldo(htmlHorasSaldo);
	setAclaracion(descuentoSegundosCerditoAlDia, segundosXDia);
}

(function() {
    'use strict';
    main();
})();
