/**
 * VoyaPulse B2B Hotelier ROI & RevPAR Simulator
 * Calculates revenue recovery, empty room monetization, and OTA commission savings
 */

const OccupancySimulator = {
  calculate({
    totalRooms = 35,
    averageDailyRate = 160,
    currentOccupancy = 52, // Percentage
    otaCommissionRate = 22 // Percentage charged by traditional OTAs
  }) {
    // Basic metrics
    const totalYearlyRoomNights = totalRooms * 365;
    const currentOccupiedNights = Math.round(totalYearlyRoomNights * (currentOccupancy / 100));
    const currentEmptyNights = totalYearlyRoomNights - currentOccupiedNights;

    // Baseline Financials
    const baselineGrossRoomRevenue = currentOccupiedNights * averageDailyRate;
    const currentOtaCommissionPaid = Math.round(baselineGrossRoomRevenue * (otaCommissionRate / 100));
    const baselineNetRoomRevenue = baselineGrossRoomRevenue - currentOtaCommissionPaid;

    // VoyaPulse Revival Engine Impact:
    // Captures 45% of previously empty perishable nights through off-peak synergy bundling & workations
    const recoveredEmptyNights = Math.round(currentEmptyNights * 0.44);
    const newTotalOccupiedNights = currentOccupiedNights + recoveredEmptyNights;
    const newOccupancyRate = Math.min(94, Math.round((newTotalOccupiedNights / totalYearlyRoomNights) * 100));
    const occupancyLiftPercentage = newOccupancyRate - currentOccupancy;

    // Pricing for recovered nights (optimized dynamic bundle rate, average 85% of ADR)
    const bundleAdr = Math.round(averageDailyRate * 0.88);
    const incrementalGrossRevenue = recoveredEmptyNights * bundleAdr;

    // VoyaPulse micro-fee is only 4% (compared to 22% standard OTA)
    const voyaFeeRate = 4.0; // 4%
    const voyaFeeOnIncremental = Math.round(incrementalGrossRevenue * (voyaFeeRate / 100));
    const netIncrementalRoomProfit = incrementalGrossRevenue - voyaFeeOnIncremental;

    // Commission savings on existing direct + VoyaPulse bookings
    // Assuming 50% of existing OTA volume shifts to VoyaPulse direct-mesh booking:
    const shiftedVolume = baselineGrossRoomRevenue * 0.50;
    const commissionSavedOnShift = Math.round(shiftedVolume * ((otaCommissionRate - voyaFeeRate) / 100));

    // Ancillary Revenue: Hotel earns 10% referral kickback on local tours/culinary experiences booked via pass
    // Avg experience spend per occupied room night = $35, hotel gets 10%
    const ancillaryKickbackIncome = Math.round(newTotalOccupiedNights * 35 * 0.10);

    // Total New Annual Net Profit Uplift
    const totalAnnualProfitUplift = netIncrementalRoomProfit + commissionSavedOnShift + ancillaryKickbackIncome;

    // RevPAR (Revenue Per Available Room)
    const baselineRevPAR = Math.round(baselineGrossRoomRevenue / totalYearlyRoomNights);
    const newRevPAR = Math.round((baselineGrossRoomRevenue + incrementalGrossRevenue) / totalYearlyRoomNights);
    const revParGrowth = Math.round(((newRevPAR - baselineRevPAR) / baselineRevPAR) * 100);

    return {
      inputs: {
        totalRooms,
        averageDailyRate,
        currentOccupancy,
        otaCommissionRate
      },
      results: {
        currentOccupiedNights,
        currentEmptyNights,
        recoveredEmptyNights,
        newOccupancyRate,
        occupancyLiftPercentage,
        baselineGrossRoomRevenue,
        currentOtaCommissionPaid,
        incrementalGrossRevenue,
        commissionSavedOnShift,
        ancillaryKickbackIncome,
        totalAnnualProfitUplift,
        baselineRevPAR,
        newRevPAR,
        revParGrowth
      }
    };
  }
};

if (typeof window !== 'undefined') {
  window.OccupancySimulator = OccupancySimulator;
}
