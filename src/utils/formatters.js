export const formatLongDate=value=>new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(new Date(value))
export const formatShortDate=value=>new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(value))
export function formatSetCompact(set,type){if(type==='duration')return `${set.durationSeconds} sec`;if(type==='weight_reps')return `${set.weight} lb × ${set.reps}`;return `${set.reps}`}
export function formatSetDetail(set,type){if(type==='duration')return `${set.durationSeconds} sec`;if(type==='weight_reps')return `${set.weight} lb × ${set.reps} reps`;return `${set.reps} reps`}
