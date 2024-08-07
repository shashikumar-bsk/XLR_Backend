import express, { Request, Response } from 'express';
import Address from '../db/models/Address'; 

const AddressRouter = express.Router();

// Route to create a new address
AddressRouter.post('/create', async (req: Request, res: Response) => {
  try {
    const { house_number, apartment, landmark, type, user_id, city, state, zipcode, country, alternative_phone_number } = req.body;

  
    if (!house_number || !type || !user_id) {
      return res.status(400).send({ message: 'Please fill in all required fields.' });
    }


    const newAddress = await Address.create({
      house_number,
      apartment,
      landmark,
      type,
      user_id,
      city,
      state,
      zipcode,
      country,
      alternative_phone_number
    });

    return res.status(201).send({ message: 'Address created successfully', address: newAddress });
  } catch (error: any) {
    console.error('Error creating address:', error);
    return res.status(500).send({ message: `Error creating address: ${error.message}` });
  }
});

// Route to update an existing address
AddressRouter.patch('/update/:address_id', async (req: Request, res: Response) => {
  try {
    const { address_id } = req.params;
    const { house_number, apartment, landmark, type, user_id, city, state, zipcode, country, alternative_phone_number } = req.body;

    // Find address by ID
    const address = await Address.findByPk(address_id);
    if (!address) {
      return res.status(404).send({ message: 'Address not found.' });
    }

    // Update address details
    await address.update({
      house_number,
      apartment,
      landmark,
      type,
      user_id,
      city,
      state,
      zipcode,
      country,
      alternative_phone_number
    });

    return res.status(200).send({ message: 'Address updated successfully', address });
  } catch (error: any) {
    console.error('Error updating address:', error);
    return res.status(500).send({ message: `Error updating address: ${error.message}` });
  }
});

// Route to retrieve an address by ID
AddressRouter.get('/details/:address_id', async (req: Request, res: Response) => {
  try {
    const { address_id } = req.params;

    // Find address by ID
    const address = await Address.findByPk(address_id);
    if (!address) {
      return res.status(404).send({ message: 'Address not found.' });
    }

    return res.status(200).send({ address });
  } catch (error: any) {
    console.error('Error retrieving address details:', error);
    return res.status(500).send({ message: `Error retrieving address details: ${error.message}` });
  }
});

// Route to delete an address by ID
AddressRouter.delete('/delete/:address_id', async (req: Request, res: Response) => {
  try {
    const { address_id } = req.params;

    // Find and delete address by ID
    const result = await Address.destroy({ where: { address_id } });
    if (result === 0) {
      return res.status(404).send({ message: 'Address not found.' });
    }

    return res.status(200).send({ message: 'Address deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting address:', error);
    return res.status(500).send({ message: `Error deleting address: ${error.message}` });
  }
});

export default AddressRouter;
