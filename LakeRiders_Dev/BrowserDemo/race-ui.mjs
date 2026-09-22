export const finishMilestones=[
  {id:'final-1000',at:2000,title:'距离终点 1 KM',subtitle:'准备进入最后一公里',duration:1.8},
  {id:'final-500',at:2500,title:'距离终点 500 M',subtitle:'卡住路线 · 准备冲刺',duration:1.6},
  {id:'final-200',at:2800,title:'最后 200 M · 冲刺！',subtitle:'终点就在前方',duration:2}
];

export function crossedFinishMilestones(previousDistance,currentDistance,seen=new Set()){
  const hits=[];
  for(const milestone of finishMilestones){
    if(seen.has(milestone.id)||previousDistance>=milestone.at||currentDistance<milestone.at)continue;
    seen.add(milestone.id);hits.push(milestone);
  }
  return hits;
}
