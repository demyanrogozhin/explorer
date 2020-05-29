import React, { useEffect, useState } from 'react';
import { Step } from 'semantic-ui-react';
import { useSubstrate } from '../substrate-lib';
import { CeremonyPhaseTimer } from './CeremonyPhaseTimer';

const ceremonyPhases = [
  'REGISTERING',
  'ASSIGNING',
  'ATTESTING'
];

const formatDate = (timestamp) => (new Date(timestamp)).toLocaleString();

function CeremonyPhases (props) {
  const { small } = props;
  const { api } = useSubstrate();
  const {
    encointerScheduler: {
      currentCeremonyIndex: getCurrentCeremonyIndex,
      currentPhase: getCurrentPhase,
      nextPhaseTimestamp: getNextPhaseTimestamp
    }
  } = api.query;
  const [currentCeremonyIndex, setCurrentCeremonyIndex] = useState(0);
  const [nextPhaseTimestamp, setNextPhaseTimestamp] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(-1);

  const phasesSteps = phase => {
    const phasesProps = (currentPhase === -1 ? [] : ceremonyPhases)
      .map((phase, idx) => ({
        key: ceremonyPhases[idx],
        active: (idx === currentPhase),
        className: 'step-'.concat(ceremonyPhases[idx]).toLowerCase()
      })).filter((prop, idx) =>
        !small || prop.active || idx === currentPhase + 1 || (idx === 0 && currentPhase === 2)
      );
    return (small && currentPhase === 2) ? phasesProps.reverse() : phasesProps;
  };
  useEffect(() => {
    let unsubscribeAll = null;
    api.queryMulti([
      getCurrentCeremonyIndex,
      getCurrentPhase,
      getNextPhaseTimestamp
    ], ([newCeremonyIndex, newPhase, newPhaseTimestamp]) => {
      setCurrentCeremonyIndex(newCeremonyIndex.toNumber());
      setCurrentPhase(newPhase.toNumber());
      setNextPhaseTimestamp(newPhaseTimestamp.toNumber());
    })
      .then(unsub => {
        unsubscribeAll = unsub;
      })
      .catch(console.error);

    return () => unsubscribeAll && unsubscribeAll();
  }, [api, getCurrentCeremonyIndex, getCurrentPhase, getNextPhaseTimestamp]);

  return (
    <Step.Group
      ordered
      unstackable
      className={[
        ceremonyPhases[currentPhase],
        small ? 'small-screen' : ''
      ].join(' ')}
      size='mini'>{
        phasesSteps(currentPhase)
          .map((props, idx) => (
            <Step {...props}>
              <Step.Content>
                <Step.Title>{props.key}</Step.Title>
                <Step.Description>{
                  (props.active)
                    ? <CeremonyPhaseTimer nextPhaseTimestamp={nextPhaseTimestamp} />
                    : (small
                      ? formatDate(nextPhaseTimestamp)
                      : ((idx === (currentPhase + 1) ||
                          (idx === 0 && currentPhase === 2))
                        ? formatDate(nextPhaseTimestamp)
                        : `ceremony #${currentCeremonyIndex}`))
                }</Step.Description>
              </Step.Content>
            </Step>
          ))
      }</Step.Group>
  );
}

export default function MapCeremonyPhases (props) {
  const { api } = useSubstrate();
  return api && api.query &&
    api.query.encointerScheduler &&
    api.query.encointerScheduler.currentCeremonyIndex &&
    api.query.encointerScheduler.nextPhaseTimestamp &&
    api.query.encointerScheduler.currentPhase ? (
      <div className='encointer-map-ceremony-phase'>
        <CeremonyPhases {...props} />
      </div>
    ) : null;
}
