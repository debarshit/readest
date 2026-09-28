import { useState } from 'react';
import { AvailablePlan, PlanInterval, PlanType, UserPlan } from '@/types/quota';
import { getPlanDetails, getSubscriptionIntervals, getYearlySavingsPercent } from '../utils/plan';
import { detectUserRegion, RegionPricing, setStoredUserRegion } from '../utils/regionalPricing';
import BillingIntervalToggle from './BillingIntervalToggle';
import RegionSelector from './RegionSelector';
import PlanCard from './PlanCard';

interface PlansComparisonProps {
  availablePlans: AvailablePlan[];
  userPlan: UserPlan;
  /** Defaults to false: an unknown state shows the buy button, never hides it. */
  customizationPurchased?: boolean;
  onSubscribe: (priceId?: string, planType?: PlanType) => void;
}

const PLAN_ORDER: UserPlan[] = ['free', 'plus'];
const RECOMMENDED_PLAN: UserPlan = 'plus';

const PlansComparison: React.FC<PlansComparisonProps> = ({
  availablePlans,
  customizationPurchased = false,
  userPlan,
  onSubscribe,
}) => {
  const [interval, setInterval] = useState<PlanInterval>('month');
  const [selectedRegion, setSelectedRegion] = useState<RegionPricing>(() => detectUserRegion());

  const intervals = getSubscriptionIntervals(availablePlans);
  const savingsPercent = getYearlySavingsPercent(availablePlans, selectedRegion);
  const selectedInterval = intervals.includes(interval) ? interval : 'month';

  const userPlanIndex = Math.max(0, PLAN_ORDER.indexOf(userPlan));
  const allPlans = PLAN_ORDER.map((plan) =>
    getPlanDetails(plan, availablePlans, selectedInterval, selectedRegion),
  );

  const handleRegionChange = (region: RegionPricing) => {
    setSelectedRegion(region);
    setStoredUserRegion(region.regionCode);
  };

  return (
    <div className='flex flex-col gap-6'>
      <div className='flex items-center justify-between gap-2 px-4 sm:px-0'>
        <BillingIntervalToggle
          intervals={intervals}
          value={selectedInterval}
          savingsPercent={savingsPercent}
          onChange={setInterval}
        />
        <div className='ml-auto shrink-0'>
          <RegionSelector selectedRegion={selectedRegion} onSelectRegion={handleRegionChange} />
        </div>
      </div>

      <div className='flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 pt-1 px-4 sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0 sm:pt-0 sm:px-0'>
        {allPlans.map((plan, index) => (
          <div
            key={plan.plan}
            className='w-[82vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none sm:shrink sm:snap-align-none flex flex-col h-full'
          >
            <PlanCard
              plan={plan}
              interval={selectedInterval}
              isUserPlan={plan.plan === userPlan}
              recommended={plan.plan === RECOMMENDED_PLAN}
              canSwitchInterval={intervals.length > 1}
              customizationPurchased={customizationPurchased}
              upgradable={index > 0 && (index > userPlanIndex || userPlan === 'purchase')}
              onSubscribe={onSubscribe}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlansComparison;
