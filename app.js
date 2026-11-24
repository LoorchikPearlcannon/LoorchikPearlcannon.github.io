(() => {
  const model = window.CANNON_MODEL;
  const canvas = document.getElementById('cannonScene');
  const backgroundVideo = document.querySelector('.scene-video');
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let angle = -0.52, dragging = false, lastX = 0, pixelRatio = 1;
  const [sx, sy, sz] = model.size;
  function resize() {
    const rect = canvas.getBoundingClientRect(); pixelRatio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(rect.width * pixelRatio); canvas.height = Math.round(rect.height * pixelRatio);
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  }
  const vertices = [[0,0,0],[1,0,0],[1,1,0],[0,1,0],[0,0,1],[1,0,1],[1,1,1],[0,1,1]];
  const faces = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]];
  const faceShade = [0.82,1.12,0.72,0.92,0.66,0.78];
  function render(now) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    if (!dragging && !reduced) angle += 0.0018;
    const c=Math.cos(angle), s=Math.sin(angle), pitch=0.46;
    const scale=Math.min(w/47,h/48)*0.9;
    const originX=w*0.70, originY=h*0.49;
    const cosP=Math.cos(pitch), sinP=Math.sin(pitch);
    const cubes=[];
    for(const [x,y,z,color] of model.blocks){
      const cx=x-sx/2, cy=y-sy/2, cz=z-sz/2;
      const rx=cx*c-cz*s, rz=cx*s+cz*c;
      const depth=rz*cosP+cy*sinP;
      cubes.push({x,y,z,color,depth});
    }
    cubes.sort((a,b)=>a.depth-b.depth);
    for(const block of cubes){
      const {x,y,z,color}=block;
      const pts=vertices.map(([vx,vy,vz])=>{
        const cx=x+vx-sx/2, cy=y+vy-sy/2, cz=z+vz-sz/2;
        const rx=cx*c-cz*s, rz=cx*s+cz*c;
        return [originX+rx*scale,originY-(cy*cosP-rz*sinP)*scale];
      });
      for(let fi=0;fi<faces.length;fi++){
        const poly=faces[fi].map(id=>pts[id]);
        const [a,b,d]=poly;
        if(((b[0]-a[0])*(d[1]-a[1])-(b[1]-a[1])*(d[0]-a[0]))<0) continue;
        const shade=faceShade[fi];
        ctx.fillStyle=shade===1?color:shadeColor(color,shade);
        ctx.beginPath();ctx.moveTo(poly[0][0],poly[0][1]);for(let j=1;j<4;j++)ctx.lineTo(poly[j][0],poly[j][1]);ctx.closePath();ctx.fill();
        ctx.strokeStyle='rgba(12,18,15,.48)';ctx.lineWidth=.65;ctx.stroke();
      }
    }
    requestAnimationFrame(render);
  }
  function shadeColor(hex,factor){const n=parseInt(hex.slice(1),16);const r=Math.min(255,((n>>16)&255)*factor)|0,g=Math.min(255,((n>>8)&255)*factor)|0,b=Math.min(255,(n&255)*factor)|0;return `rgb(${r},${g},${b})`;}
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;canvas.setPointerCapture(e.pointerId)});
  canvas.addEventListener('pointermove',e=>{if(dragging){angle+=(e.clientX-lastX)*0.008;lastX=e.clientX}});
  canvas.addEventListener('pointerup',()=>dragging=false);canvas.addEventListener('pointercancel',()=>dragging=false);
  function startModelFallback(){document.querySelector('.scene').classList.add('model-fallback');addEventListener('resize',resize);resize();requestAnimationFrame(render)}
  if(backgroundVideo) backgroundVideo.addEventListener('error',startModelFallback,{once:true});
  else startModelFallback();

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
  function update(){
    let per,distance;
    if(mode==='items'){
      const val=Math.max(1,Math.floor(Number($('amount').value)||1));$('amount').value=val;
      per=source==='per'?val:Math.max(1,Math.floor(val/2));
      if(source==='chest'){$('amount').value=val; $('amountHint').textContent=val%2?'Enter an even total for an even split. This odd amount is rounded down to '+(per*2)+'.':'Each dispensing chest receives '+per+' items.';}
      else $('amountHint').textContent='The input chest needs twice this amount.';
      distance=per*125;
    } else {
      const target=Math.max(1,Math.floor(Number($('targetDistance').value)||1));$('targetDistance').value=target;
      per=Math.max(1,Math.round(target/125));distance=per*125;
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
    const bar=Math.min(100,Math.max(3,distance/10000*100));document.querySelector('.distance-bar span').style.width=bar+'%';
  }
  document.querySelectorAll('.mode').forEach(b=>b.addEventListener('click',()=>{mode=b.dataset.mode;document.querySelectorAll('.mode').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-selected',x===b?'true':'false')});$('itemsForm').classList.toggle('hidden',mode!=='items');$('distanceForm').classList.toggle('hidden',mode!=='distance');update()}));
  document.querySelectorAll('.source').forEach(b=>b.addEventListener('click',()=>{source=b.dataset.source;document.querySelectorAll('.source').forEach(x=>x.classList.toggle('active',x===b));$('amountLabel').textContent=source==='per'?'ITEMS PER DISPENSER':'TOTAL ITEMS IN INPUT CHEST';$('amountHint').textContent=source==='per'?'The input chest needs twice this amount.':'Each dispensing chest receives an even half.';$('amount').value=source==='per'?32:64;update()}));
  $('amount').addEventListener('input',update);$('targetDistance').addEventListener('input',update);
  document.querySelectorAll('.quick-picks button').forEach(b=>b.addEventListener('click',()=>{mode='items';source='per';document.querySelectorAll('.mode').forEach(x=>{const active=x.dataset.mode==='items';x.classList.toggle('active',active);x.setAttribute('aria-selected',active?'true':'false')});document.querySelectorAll('.source').forEach(x=>x.classList.toggle('active',x.dataset.source==='per'));$('itemsForm').classList.remove('hidden');$('distanceForm').classList.add('hidden');$('amountLabel').textContent='ITEMS PER DISPENSER';$('amount').value=b.dataset.items;update()}));
  update();
})();
