(() => {
  const backgroundVideo = document.querySelector('.scene-video');
  if (backgroundVideo) {
    backgroundVideo.muted = true;
    backgroundVideo.play().catch(() => {});
  }

  const tests=[[1000,7,5],[2000,18.5,4],[3000,17,6],[4000,20,2],[5000,22,7],[6000,27,3],[7000,30,8],[8000,33,1],[9000,36,9],[10000,39,10]];
  const $=id=>document.getElementById(id);let mode='items',source='per';
  const fmt=n=>Math.round(n).toLocaleString('en-US');
  function estimate(distance){
    const exact=tests.find(t=>t[0]===distance);
    if(exact)return {time:exact[1],tag:'MEASURED',measured:true,note:`Measured at ${fmt(distance)} blocks · Test ${exact[2]}`};
    if(distance<1000)return {time:null,tag:'NO DATA',measured:false,note:'No measured time below 1,000 blocks'};
    if(distance<=10000){
      let i=1;while(i<tests.length&&tests[i][0]<distance)i++;
      const a=tests[i-1],b=tests[i],p=(distance-a[0])/(b[0]-a[0]);
      return {time:a[1]+(b[1]-a[1])*p,tag:'ESTIMATED',measured:false,note:`Interpolated between ${fmt(a[0])}- and ${fmt(b[0])}-block tests`};
    }
    return {time:7+3.2*(distance/1000),tag:'ESTIMATED',measured:false,note:'Approximate formula extended beyond the 10,000-block tests'};
  }
  function nonNegativeInteger(input){
    const value=Math.floor(Number(input.value)||0);
    return Math.max(0,value);
  }
  function update(){
    let per,distance;
    if(mode==='items'){
      const val=nonNegativeInteger($('amount'));
      per=source==='per'?val:(val===0?0:Math.max(1,Math.floor(val/2)));
      if(source==='chest'){$('amountHint').textContent=val===0?'Enter an even total for an even split.':val%2?'Enter an even total for an even split. This odd amount is rounded down to '+(per*2)+'.':'Each dispensing chest receives '+per+' items.';}
      else $('amountHint').textContent='The input chest needs twice this amount.';
      distance=per*125;
    } else {
      const target=nonNegativeInteger($('targetDistance'));
      per=target===0?0:Math.max(1,Math.round(target/125));distance=per*125;
    }
    const time=estimate(distance);
    $('distanceOut').innerHTML=`${fmt(distance)} <small>blocks</small>`;$('perOut').textContent=fmt(per);$('totalOut').textContent=fmt(per*2);
    if(time.time===null){
      $('timeOut').innerHTML='— <small>sec</small>';
    }else{
      const seconds=Number(time.time.toFixed(1));
      let timeHtml=`${seconds.toLocaleString('en-US')} <small>sec</small>`;
      if(seconds>60){
        const minutes=Math.floor(seconds/60);
        const remaining=Number((seconds-minutes*60).toFixed(1));
        timeHtml+=` <span class="minute-display">(${minutes} min ${remaining} sec)</span>`;
      }
      $('timeOut').innerHTML=timeHtml;
    }
    $('timeTag').textContent=time.tag;$('timeTag').className='tag '+(time.measured?'measured':'estimated');$('timeNote').textContent=time.note;
    $('distanceOut').setAttribute('aria-label',`${fmt(distance)} blocks`);
    const bar=Math.min(100,Math.max(0,distance/10000*100));document.querySelector('.distance-bar span').style.width=bar+'%';
  }  document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.mode').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',x===b?'true':'false')});$('itemsForm').classList.toggle('hidden',mode!=='items');$('distanceForm').classList.toggle('hidden',mode!=='distance');update()}));
  document.querySelectorAll('.source').forEach(b=>b.addEventListener('click',()=>{source=b.dataset.source;document.querySelectorAll('.source').forEach(x=>x.classList.toggle('active',x===b));$('amountLabel').textContent=source==='per'?'ITEMS PER DISPENSER':'TOTAL ITEMS IN INPUT CHEST';$('amountHint').textContent=source==='per'?'The input chest needs twice this amount.':'Each dispensing chest receives an even half.';$('amount').value=source==='per'?32:64;update()}));
  function attachNumberInput(input){
    input.addEventListener('beforeinput',event=>{
      if(input.value==='0'&&event.inputType.startsWith('insert')&&/\d/.test(event.data||''))input.value='';
    });
    input.addEventListener('input',()=>{
      if(input.value==='')input.value='0';
      update();
    });
  }
  attachNumberInput($('amount'));attachNumberInput($('targetDistance'));
  document.querySelectorAll('.quick-picks button').forEach(b=>b.addEventListener('click',()=>{mode='items';source='per';document.querySelectorAll('.mode').forEach(x=>{const active=x.dataset.mode==='items';x.classList.toggle('active',active);x.setAttribute('aria-selected',active?'true':'false')});document.querySelectorAll('.source').forEach(x=>x.classList.toggle('active',x.dataset.source==='per'));$('itemsForm').classList.remove('hidden');$('distanceForm').classList.add('hidden');$('amountLabel').textContent='ITEMS PER DISPENSER';$('amount').value=b.dataset.items;update()}));
  update();
})();
