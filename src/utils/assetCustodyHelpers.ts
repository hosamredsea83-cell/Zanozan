import type { AppUser } from '../types/auth';
import type { EquipmentItem } from '../types/equipment';
import type { LogisticsVehicle } from '../types/logistics';
import type { PersonProfile } from '../types/personProfile';

export function equipmentBelongsToEditableUser(
  eq: EquipmentItem,
  user: AppUser
): boolean {
  if (eq.personCustody) {
    if (eq.personCustody.personStatus === 'subscribed_isolated') {
      return (
        eq.personCustody.claimedUserId === user.id ||
        eq.ownerId === user.id
      );
    }
    return (
      eq.personCustody.addedByUserId === user.id ||
      eq.ownerId === user.id
    );
  }
  return eq.ownerId === user.id;
}

export function vehicleBelongsToEditableUser(
  vehicle: LogisticsVehicle,
  user: AppUser
): boolean {
  if (vehicle.personCustody) {
    if (vehicle.personCustody.personStatus === 'subscribed_isolated') {
      return (
        vehicle.personCustody.claimedUserId === user.id ||
        vehicle.ownerId === user.id
      );
    }
    return (
      vehicle.personCustody.addedByUserId === user.id ||
      vehicle.ownerId === user.id
    );
  }
  return vehicle.ownerId === user.id;
}

export function canEditPersonProfileControls(
  profile: PersonProfile,
  user: AppUser
): boolean {
  if (
    profile.subscriptionStatus === 'subscribed_isolated' ||
    profile.subscriptionStatus === 'native_member'
  ) {
    return profile.linkedUserId === user.id;
  }
  return profile.addedByUserId === user.id;
}

export function canViewPersonProfile(
  profile: PersonProfile,
  user: AppUser
): boolean {
  if (profile.subscriptionStatus === 'native_member') return true;
  if (profile.linkedUserId === user.id) return true;
  if (profile.addedByUserId === user.id) return true;
  if (profile.pendingClaim?.requestedUserId === user.id) return true;
  return false;
}
