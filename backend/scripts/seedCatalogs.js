const mongoose = require('mongoose');
const Brand = require('../models/Brand');
const Characteristic = require('../models/Characteristic');
const CharacteristicValue = require('../models/CharacteristicValue');
const User = require('../models/User');
require('dotenv').config();

const seedCatalogs = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Conectado a MongoDB');

    const masterAdmin = await User.findOne({ role: 'Master admin' });
    if (!masterAdmin) {
      console.error('No se encontró un usuario Master admin. Ejecuta npm run create-admin primero.');
      process.exit(1);
    }

    const brandsData = [
      { name: 'Samsung', description: 'Dispositivos Samsung Galaxy' },
      { name: 'iPhone', description: 'Dispositivos Apple iPhone' },
      { name: 'Huawei', description: 'Dispositivos Huawei' },
      { name: 'Xiaomi', description: 'Dispositivos Xiaomi' },
      { name: 'Motorola', description: 'Dispositivos Motorola' }
    ];

    const createdBrands = [];
    for (const b of brandsData) {
      let brand = await Brand.findOne({ name: b.name, isActive: true });
      if (!brand) {
        brand = new Brand({ ...b, createdBy: masterAdmin._id });
        await brand.save();
        console.log('Marca creada:', brand.name);
      } else {
        console.log('Marca existe:', brand.name);
      }
      createdBrands.push(brand);
    }

    const characteristicsData = [
      { name: 'Color', description: 'Color del dispositivo', type: 'color' },
      { name: 'Almacenamiento', description: 'Capacidad de almacenamiento', type: 'select' },
      { name: 'RAM', description: 'Memoria RAM', type: 'select' },
      { name: 'Pantalla', description: 'Tamaño de pantalla', type: 'text' }
    ];

    const createdCharacteristics = [];
    for (const c of characteristicsData) {
      let ch = await Characteristic.findOne({ name: c.name, isActive: true });
      if (!ch) {
        ch = new Characteristic({ ...c, createdBy: masterAdmin._id });
        await ch.save();
        console.log('Característica creada:', ch.name);
      } else {
        console.log('Característica existe:', ch.name);
      }
      createdCharacteristics.push(ch);
    }

    const samsung = createdBrands.find(b => b.name === 'Samsung');
    const colorChar = createdCharacteristics.find(c => c.name === 'Color');

    if (samsung && colorChar) {
      const samsungColors = [
        { value: 'verde-grisaceo', displayName: 'Verde Grisáceo', hexColor: '#7C8471' },
        { value: 'negro-fantasma', displayName: 'Negro Fantasma', hexColor: '#2C2C2E' },
        { value: 'beige', displayName: 'Beige', hexColor: '#F5F5DC' }
      ];

      for (const col of samsungColors) {
        let ev = await CharacteristicValue.findOne({ characteristic: colorChar._id, brand: samsung._id, value: col.value, isActive: true });
        if (!ev) {
          ev = new CharacteristicValue({ characteristic: colorChar._id, brand: samsung._id, ...col, createdBy: masterAdmin._id });
          await ev.save();
          console.log('Color Samsung creado:', col.displayName);
        } else {
          console.log('Color existe:', col.displayName);
        }
      }
    }

    const storageChar = createdCharacteristics.find(c => c.name === 'Almacenamiento');
    if (storageChar) {
      const storageValues = ['64GB', '128GB', '256GB', '512GB', '1TB'];
      for (const brand of createdBrands) {
        for (const s of storageValues) {
          const val = s.toLowerCase();
          let ev = await CharacteristicValue.findOne({ characteristic: storageChar._id, brand: brand._id, value: val, isActive: true });
          if (!ev) {
            ev = new CharacteristicValue({ characteristic: storageChar._id, brand: brand._id, value: val, displayName: s, createdBy: masterAdmin._id });
            await ev.save();
          }
        }
      }
      console.log('Opciones de almacenamiento creadas');
    }

    console.log('Seed terminado');
    process.exit(0);
  } catch (error) {
    console.error('Error en seed:', error);
    process.exit(1);
  }
};

seedCatalogs();
