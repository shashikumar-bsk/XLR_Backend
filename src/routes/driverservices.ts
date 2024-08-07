import Driver from '../db/models/driver';

export async function fetchAvailableDrivers() {
  try {
    const availableDrivers = await Driver.findAll({
      where: {
        status: 'available',
        active: true,
        is_deleted: false
      }
    });
    return availableDrivers;
  } catch (error) {
    console.error('Error fetching available drivers:', error);
    throw error;
  }
}
