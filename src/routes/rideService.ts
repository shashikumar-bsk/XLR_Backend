import RideRequest from '../db/models/riderequest';
import Driver from '../db/models/driver';

// Update ride request
export async function updateRideRequest(rideRequestId: string, updates: any) {
  try {
    const rideRequest = await RideRequest.findByPk(rideRequestId);
    if (!rideRequest) throw new Error('Ride request not found');
    await rideRequest.update(updates);
    return rideRequest;
  } catch (error) {
    console.error('Error updating ride request:', error);
    throw error;
  }
}

// Update driver status
export async function updateDriverStatus(driver_id: string, status: string) {
  try {
    const driver = await Driver.findByPk(driver_id);
    if (!driver) throw new Error('Driver not found');
    await driver.update({ status });
    return driver;
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw error;
  }
}

// Handle ride acceptance
export async function acceptRide(request_id: string, driver_id: string) {
  try {
    const rideRequest = await updateRideRequest(request_id, { status: 'accepted', driver_id: driver_id });
    const driver = await updateDriverStatus(driver_id, 'on ride');
    return { rideRequest, driver };
  } catch (error) {
    console.error('Error accepting ride:', error);
    throw error;
  }
}

// Handle ride rejection
export async function rejectRide(rideRequestId: string, driverId: string) {
  try {
    const rideRequest = await updateRideRequest(rideRequestId, { status: 'rejected', driver_id: driverId });
    const driver = await updateDriverStatus(driverId, 'available');
    return { rideRequest, driver };
  } catch (error) {
    console.error('Error rejecting ride:', error);
    throw error;
  }
}

// Handle ride completion
export async function completeRide(rideRequestId: string, driverId: string) {
  try {
    const rideRequest = await updateRideRequest(rideRequestId, { status: 'completed' });
    const driver = await updateDriverStatus(driverId, 'available');
    return { rideRequest, driver };
  } catch (error) {
    console.error('Error completing ride:', error);
    throw error;
  }
}
