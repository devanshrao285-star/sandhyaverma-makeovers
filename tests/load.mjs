import assert from 'node:assert/strict';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4321';
const url=new URL(base);
if(!['127.0.0.1','localhost'].includes(url.hostname))throw new Error('Load smoke test is restricted to local preview.');
const routes=['/','/services/','/portfolio/','/contact/'];
const started=performance.now();
const results=await Promise.all(Array.from({length:100},async(_,index)=>{
 const start=performance.now();const response=await fetch(base+routes[index%routes.length]);return {status:response.status,ms:performance.now()-start};
}));
assert(results.every(result=>result.status===200),'Every local visitor request should return HTTP 200.');
const durations=results.map(result=>result.ms).sort((a,b)=>a-b);
const percentile=durations[Math.ceil(durations.length*.95)-1];
console.log(JSON.stringify({visitors:results.length,successful:results.length,p95Ms:Math.round(percentile),totalMs:Math.round(performance.now()-started)}));
