// programacao-render.js
// Renderiza a interface de programação dentro de #programacao-root
(function(){
  'use strict';
  function q(sel, ctx){ return (ctx||document).querySelector(sel); }
  function qAll(sel, ctx){ return Array.from((ctx||document).querySelectorAll(sel)); }

  var ROOT_ID = 'programacao-root';
  var root = q('#' + ROOT_ID);
  if (!root) return;

  var stations = [
    { key: 'sp', label: 'São Paulo' },
    { key: 'bh', label: 'Belo Horizonte' },
    { key: 'pa', label: 'Pará de Minas' }
  ];
  var days = [
    { key: 'seg-sex', label: 'Segunda a Sexta' },
    { key: 'sab', label: 'Sábado' },
    { key: 'dom', label: 'Domingo' }
  ];

  function createButton(text, cls){
    var b = document.createElement('button');
    b.type = 'button';
    if (cls) b.className = cls;
    b.textContent = text;
    return b;
  }

  function buildUI(){
    root.innerHTML = '';

    var stationsWrap = document.createElement('div');
    stationsWrap.className = 'stations';
    stations.forEach(function(s, idx){
      var b = createButton(s.label, (idx===0?'active':''));
      b.dataset.station = s.key;
      b.addEventListener('click', function(){
        setActiveStation(s.key);
      });
      stationsWrap.appendChild(b);
    });
    root.appendChild(stationsWrap);

    var daysWrap = document.createElement('div');
    daysWrap.className = 'days';
    days.forEach(function(d, idx){
      var b = createButton(d.label, (idx===0?'active':'')); b.dataset.day = d.key;
      b.addEventListener('click', function(){ setActiveDay(d.key); });
      daysWrap.appendChild(b);
    });
    root.appendChild(daysWrap);

    var container = document.createElement('div');
    container.id = 'schedule-container';
    root.appendChild(container);

    // initial render
    setActiveStation(stations[0].key);
    setActiveDay(days[0].key);
  }

  function setActiveStation(key){
    qAll('.stations button').forEach(function(b){ b.classList.toggle('active', b.dataset.station===key); });
    root.dataset.station = key;
    renderSchedule();
  }

  function setActiveDay(dayKey){
    qAll('.days button').forEach(function(b){ b.classList.toggle('active', b.dataset.day===dayKey); });
    root.dataset.day = dayKey;
    renderSchedule();
  }

  function renderSchedule(){
    var stationKey = root.dataset.station || stations[0].key;
    var dayKey = root.dataset.day || days[0].key;
    var container = q('#schedule-container', root);
    container.innerHTML = '';

    var title = document.createElement('h3');
    var stationLabel = stations.find(function(s){ return s.key===stationKey; });
    var dayLabel = days.find(function(d){ return d.key===dayKey; });
    title.textContent = (stationLabel ? stationLabel.label : stationKey) + ' — ' + (dayLabel ? dayLabel.label : dayKey);
    container.appendChild(title);

    var scheduleData = (window.PROGRAMACAO && window.PROGRAMACAO[stationKey] && window.PROGRAMACAO[stationKey][dayKey]) ? window.PROGRAMACAO[stationKey][dayKey] : null;

    if (!scheduleData || !Array.isArray(scheduleData) || scheduleData.length === 0){
      var p = document.createElement('p'); p.className = 'note'; p.textContent = 'Programação não disponível.';
      container.appendChild(p);
      return;
    }

    var table = document.createElement('table'); table.className = 'schedule-table';
    var thead = document.createElement('thead');
    var hrow = document.createElement('tr');
    var thTime = document.createElement('th'); thTime.textContent = 'Horário'; hrow.appendChild(thTime);
    var thProg = document.createElement('th'); thProg.textContent = 'Programa'; hrow.appendChild(thProg);
    thead.appendChild(hrow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    scheduleData.forEach(function(item){
      var tr = document.createElement('tr');
      var tdTime = document.createElement('td'); tdTime.className = 'time'; tdTime.textContent = item.time || '';
      var tdProg = document.createElement('td'); tdProg.className = 'program'; tdProg.textContent = item.title || '';
      tr.appendChild(tdTime); tr.appendChild(tdProg);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    container.appendChild(table);
  }

  // init
  document.addEventListener('DOMContentLoaded', function(){
    // if program data not loaded yet, wait a short time and retry
    if (!window.PROGRAMACAO){
      var attempts = 0;
      var int = setInterval(function(){
        attempts++;
        if (window.PROGRAMACAO || attempts > 10){
          clearInterval(int);
          buildUI();
        }
      }, 150);
    } else {
      buildUI();
    }
  });

})();