/**
 * VoyaPulse AI Itinerary & Smart Dispersal Engine
 * Generates dynamic, off-peak synergy itineraries matching traveler vibe and work needs
 */

const ItineraryEngine = {
  generate({ vibe = "all", duration = 4, style = "workation", budget = "balanced" }) {
    const data = window.VoyaData;
    if (!data) return null;

    // Select the best destination match based on vibe & style
    let destination = data.destinations.find(d => {
      if (vibe === "all") return true;
      return d.vibe.some(v => v.toLowerCase() === vibe.toLowerCase());
    }) || data.destinations[0];

    // Find associated hotel & experience
    let hotel = data.hotels.find(h => h.destinationId === destination.id) || data.hotels[0];
    let experience = data.experiences.find(e => e.destinationId === destination.id) || data.experiences[0];

    // Calculate budget multiplier
    let durationDays = parseInt(duration, 10) || 4;
    let nights = durationDays - 1 > 0 ? durationDays - 1 : 1;

    // Pricing calculation
    let unbundledHotelTotal = hotel.standardOtaPrice * nights;
    let unbundledExpTotal = experience.otaPrice;
    let unbundledTransit = 35 * nights;
    let totalUnbundled = unbundledHotelTotal + unbundledExpTotal + unbundledTransit;

    // VoyaPulse synergy calculation:
    // Off-peak hotel rate (direct without 25% OTA cut)
    let synergyHotelTotal = hotel.pricePerNight * nights;
    let synergyExpTotal = experience.price;
    let synergyTransit = 22 * nights; // Shared electric or train pass
    let synergyTotal = Math.round((synergyHotelTotal + synergyExpTotal + synergyTransit) * 0.92); // 8% bundle booster discount
    let totalSaved = totalUnbundled - synergyTotal;
    let percentageSaved = Math.round((totalSaved / totalUnbundled) * 100);

    // Build day-by-day dynamic schedule
    const days = [];

    // Day 1
    days.push({
      day: 1,
      title: `Arrival in ${destination.name} & Seamless Check-In`,
      hotelAction: `Check into ${hotel.name}. Received keyless pass & verified high-speed Wi-Fi token.`,
      experienceAction: `Welcome aperitivo with host ${hotel.hostName}. Intro to neighborhood hidden trails.`,
      mobility: "Zero-emission electric transit shuttle from regional hub directly to property.",
      localImpact: "Direct welcome basket sourced 100% from village cooperatives."
    });

    // Day 2
    if (durationDays >= 2) {
      days.push({
        day: 2,
        title: style === "workation" ? "Deep Focus Morning & Local Artisan Immersion" : "Cultural Discovery & Artisan Encounter",
        hotelAction: style === "workation" 
          ? "Dedicated ergonomic desk session in panoramic quiet lounge (300 Mbps fiber)." 
          : "Fresh organic orchard breakfast & leisurely village stroll.",
        experienceAction: `${experience.title} hosted by ${experience.guide}.`,
        mobility: "Solar E-Bike loan included with room pass.",
        localImpact: `$${experience.price} goes directly into ${experience.guide}'s artisan guild.`
      });
    }

    // Day 3
    if (durationDays >= 3) {
      days.push({
        day: 3,
        title: "Off-Peak Secret Trails & Gastronomic Masterclass",
        hotelAction: `${hotel.offPeakPerk}`,
        experienceAction: "Private cooking workshop with third-generation regional cooks using heirloom ingredients.",
        mobility: "Pedestrian-first historic center & scenic cliffside train loop.",
        localImpact: "Zero food miles; patronizing 4 family-run suppliers."
      });
    }

    // Day 4 (and beyond)
    if (durationDays >= 4) {
      days.push({
        day: durationDays,
        title: "Community Regeneration & Relaxed Departure",
        hotelAction: "Late 3:00 PM check-out privileges granted via VoyaPulse off-peak perk.",
        experienceAction: "Participate in local tree planting / heritage archive preservation session.",
        mobility: "Coordinated green departure shuttle back to express train station.",
        localImpact: "1 tree planted and recorded on your digital pass carbon ledger."
      });
    }

    return {
      destination,
      hotel,
      experience,
      durationDays,
      nights,
      pricing: {
        totalUnbundled,
        synergyTotal,
        totalSaved,
        percentageSaved,
        hotelNetBenefit: "+32% net margin vs Booking.com / Airbnb",
        localEconomyContribution: `$${Math.round(synergyTotal * 0.88)} kept directly in the local community`
      },
      days
    };
  }
};

if (typeof window !== 'undefined') {
  window.ItineraryEngine = ItineraryEngine;
}
