
import allStates from '@/data/states.json';
import lgasByState from '@/data/lgas.json';
import allWards from '@/data/wards.json';

const wardsByLga: { [key: string]: string[] } = {};

allWards.forEach((wardData) => {
  if (!wardsByLga[wardData.LGA]) {
    wardsByLga[wardData.LGA] = [];
  }
  wardsByLga[wardData.LGA].push(wardData.Ward);
});

export { allStates, lgasByState, wardsByLga, allWards };
