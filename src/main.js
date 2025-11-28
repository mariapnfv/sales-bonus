/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */
function calculateSimpleRevenue(purchase, _product) {
  // @TODO: Расчет выручки от операции
  const discount = 1 - (purchase.discount / 100);
  //console.log(discount);
  // Возвращает выручку, рассчитанную по формуле: sale_price * quantity * discount
  return purchase.sale_price * purchase.quantity * discount;
}

/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  // @TODO: Расчет бонуса от позиции в рейтинге
  const profit = seller.profit;
  if (index === 0) {
    // 15% — для продавца, который принёс наибольшую прибыль (индекс 0)
    return profit * 0.15;
  } else if (index === 1 || index === 2) {
    // 10% — для продавцов, которые оказались на втором (индекс 1) и третьем (индекс 2) месте
    return profit * 0.10;
  } else if (index === total - 1) {
    // 0% — для продавца, который оказался на последнем месте (индекс равен total - 1)
    return 0; // Бонус равен нулю, независимо от прибыли
  } else {
    // 5% — для всех остальных продавцов, кроме последнего
    return profit * 0.05;
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */
function analyzeSalesData(data, options) {
  // @TODO: Проверка входных данных
  if (!data
    || !Array.isArray(data.sellers)
    || !Array.isArray(data.products)
    || !Array.isArray(data.purchase_records)
  ) {
    throw new Error('Некорректные входные данные');
  }
  // @TODO: Проверка наличия опций
  const { calculateRevenue, calculateBonus } = options;

  if (!calculateRevenue || !calculateBonus) {
    {
      throw new Error('Чего-то не хватает');
    }
  }
  // @TODO: Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map(seller => ({
    // Заполним начальными данными
    id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`

  }));
 // console.log(sellerStats);
  // @TODO: Индексация продавцов и товаров для быстрого доступа
  const sellerIndex = Object.fromEntries(sellerStats.map(item => [item.id, item])); // Ключом будет id, значением — запись из sellerStats
 //console.log(sellerIndex);
  const productIndex = Object.fromEntries(data.products.map(item => [item.sku, item])); // Ключом будет sku, значением — запись из data.products 
 // console.log(productIndex);
  // @TODO: Расчет выручки и прибыли для каждого продавца
  //const sales_count = 0;
  data.purchase_records.forEach(record => { // Чек 
    const seller = sellerIndex[record.seller_id]; // Продавец
    // Увеличить количество продаж 
    if (!seller.sales_count) {
      seller.sales_count = 0;
    }
    seller.sales_count += 1;
    // Увеличить общую сумму всех продаж
    if (!seller.revenue) {
      seller.revenue = 0;
    }
    seller.revenue += record.total_amount;
    //console.log(seller);

    // Расчёт прибыли для каждого товара
    record.items.forEach(item => {
      const product = productIndex[item.sku]; // Товар
      // Посчитать себестоимость (cost) товара как product.purchase_price, умноженную на количество товаров из чека
      const cost = product.purchase_price * item.quantity;
     // console.log(cost);
      // Посчитать выручку (revenue) с учётом скидки через функцию calculateRevenue
      const revenue = calculateRevenue(item, record.seller_id);
     // console.log(revenue);
      // Посчитать прибыль: выручка минус себестоимость
      const profit = revenue - cost;
      //console.log(profit);

      // Увеличить общую накопленную прибыль (profit) у продавца  
      if (!seller.profit) {
        seller.profit = 0;
      }
      seller.profit = seller.profit + profit;


     // console.log(seller.profit);
      // Учёт количества проданных товаров
      if (!seller.products_sold) {
        seller.products_sold = {};
      }
      if (!seller.products_sold[item.sku]) {
        seller.products_sold[item.sku] = 0;
      }

      // По артикулу товара увеличить его проданное количество у продавца
      seller.products_sold[item.sku]++;
     // console.log(seller.products_sold);
    });
  });
  // @TODO: Сортировка продавцов по прибыли
  sellerStats.sort((a, b) => b.profit - a.profit);

  // @TODO: Назначение премий на основе ранжирования
  sellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonusByProfit(index, sellerStats.length, seller)// Считаем бонус
    seller.top_products = Object.entries(seller.products_sold)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);// Формируем топ-10 товаров
    //console.log(seller.bonus);
    //console.log(seller.top_products);
  });
  // @TODO: Подготовка итоговой коллекции с нужными полями
  return sellerStats.map(seller => ({
    seller_id: seller.id,// Строка, идентификатор продавца
    name: seller.name,// Строка, имя продавца
    revenue: +seller.revenue.toFixed(2),// Число с двумя знаками после точки, выручка продавца
    profit: +seller.profit.toFixed(2),// Число с двумя знаками после точки, прибыль продавца
    sales_count: seller.sales_count,// Целое число, количество продаж продавца
    top_products: seller.top_products, // Массив объектов вида: { "sku": "SKU_008","quantity": 10}, топ-10 товаров продавца
    bonus: +seller.bonus.toFixed(2)// Число с двумя знаками после точки, бонус продавца
  }));
}