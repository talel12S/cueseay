let meals = [];
let currentDay = 'lundi';
let validatedMeals = {}; // { lundi: meal, mardi: meal, ... }

window.addEventListener('DOMContentLoaded', () => {
  fetch('100_plats.json')
    .then(response => response.json())
    .then(plats => {
      meals = plats.map(m => ({ ...m })); // copie profonde
      generateMealPlan();
      showDay(currentDay);
    });

  // Gestion menu mobile
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
  });
});

function showDay(day) {
  currentDay = day;
  document.querySelectorAll('.day-btn').forEach(btn => btn.classList.remove('day-active'));
  const btn = document.getElementById(day + '-btn');
  if (btn) btn.classList.add('day-active');

  let meal;
  if (validatedMeals[day]) {
    meal = validatedMeals[day];
  } else {
    // Tire un plat aléatoire différent à chaque fois
    meal = { ...meals[Math.floor(Math.random() * meals.length)], day };
  }
  displayMeal(meal);
  updateWeeklySummary();
}

function displayMeal(meal) {
  if (!meal) return;
  // Suggestion du jour
  document.getElementById('meal-image').src = meal.image || '';
  document.getElementById('meal-title').textContent = meal.nom || '';
  document.getElementById('meal-description').textContent = meal.description || '';
  document.getElementById('meal-time').textContent = meal.minute || '';
  document.getElementById('meal-calories-display').textContent = meal.calories || '';

  // Formulaire détails
  document.getElementById('meal-name').value = meal.nom || '';
  document.getElementById('meal-ingredients').value = (meal.ingredients || []).join('\n');
  document.getElementById('meal-calories').value = meal.calories || '';
}

function generateMealPlan() {
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const usedMeals = new Set();

  days.forEach(day => {
    let meal;
    let tries = 0;
    do {
      meal = meals[Math.floor(Math.random() * meals.length)];
      tries++;
      // Sécurité pour éviter boucle infinie si pas assez de plats
      if (tries > 100) break;
    } while (usedMeals.has(meal.nom));
    usedMeals.add(meal.nom);
    validatedMeals[day] = meal;
  });

  updateWeeklySummary();
}

function generateForDay() {
  if (!meals.length) return;

  // Toujours retirer la validation du jour courant
  delete validatedMeals[currentDay];

  // Tire un plat aléatoire différent de l'actuel
  let newMeal;
  do {
    newMeal = { ...meals[Math.floor(Math.random() * meals.length)] };
  } while (
    (validatedMeals[currentDay] && validatedMeals[currentDay].nom === newMeal.nom) ||
    (newMeal.day === currentDay && meals.length > 1)
  );
  newMeal.day = currentDay;

  displayMeal(newMeal);
  updateWeeklySummary();
}

function saveMeal() {
  const name = document.getElementById('meal-name').value;
  const ingredientsText = document.getElementById('meal-ingredients').value;
  const calories = parseInt(document.getElementById('meal-calories').value, 10);

  // Vérifie si ce plat est déjà validé pour un autre jour
  for (const day in validatedMeals) {
    if (validatedMeals[day] && validatedMeals[day].nom === name && day !== currentDay) {
      alert("Ce plat est déjà validé pour un autre jour de la semaine !");
      return;
    }
  }

  let meal = {
    nom: name,
    ingredients: ingredientsText.split('\n').map(line => line.replace(/^-?\s*/, '')),
    calories: calories,
    image: document.getElementById('meal-image').src,
    description: document.getElementById('meal-description').textContent,
    minute: document.getElementById('meal-time').textContent,
    day: currentDay
  };

  validatedMeals[currentDay] = meal;
  alert('Repas sauvegardé pour ' + currentDay);
  updateWeeklySummary();
}


function removeAccents(str) {
  return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function findMatchingMeals() {
  const input = document.getElementById('user-ingredients').value;
  if (!input) return;
  const userIngredients = input
    .split(/[\s,;\n]+/)
    .map(i => removeAccents(i.trim().toLowerCase()))
    .filter(i => i.length > 0);

  // Filtrer les plats avec au moins 2 ingrédients en commun (tolérance sur accents et début du mot)
  const matching = meals.filter(meal => {
    const mealIngredients = meal.ingredients.map(i => removeAccents(i.toLowerCase()));
    const common = userIngredients.filter(ing =>
      mealIngredients.some(mi => mi.startsWith(ing.slice(0, 4)))
    );
    return common.length >= 2;
  });

  // Afficher les plats trouvés
  const container = document.getElementById('matching-meals');
  if (matching.length === 0) {
    container.innerHTML = "<p class='text-red-500'>Aucun plat trouvé avec au moins 2 de vos ingrédients.</p>";
    return;
  }
  container.innerHTML = matching.map(meal => `
    <div class="bg-green-50 rounded-lg p-4 shadow">
      <img src="${meal.image}" alt="${meal.nom}" class="w-full h-32 object-cover rounded mb-2">
      <h3 class="font-bold text-lg mb-1">${meal.nom}</h3>
      <p class="text-sm text-gray-600 mb-2">${meal.description}</p>
      <p class="text-xs text-gray-500">Ingrédients : ${meal.ingredients.join(', ')}</p>
    </div>
  `).join('');
}

function generateAndShowSummary() {
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  validatedMeals = {}; // On réinitialise les plats validés

  days.forEach(day => {
    // Tire un plat aléatoire pour chaque jour
    const meal = { ...meals[Math.floor(Math.random() * meals.length)], day };
    validatedMeals[day] = meal;
  });

  updateWeeklySummary();
  switchTab('planifier');
  setTimeout(() => {
    const summary = document.getElementById('weekly-summary');
    if (summary) summary.scrollIntoView({ behavior: 'smooth' });
  }, 100);
}

function updateWeeklySummary() {
  const days = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];
  const summaryGrid = document.getElementById('summary-grid');
  if (!summaryGrid) return;
  summaryGrid.innerHTML = '';

  days.forEach(day => {
    const meal = validatedMeals[day];
    if (meal) {
      summaryGrid.innerHTML += `
        <div class="border rounded-lg p-3 text-center">
          <h5 class="font-bold text-green-700 capitalize">${day}</h5>
          <img src="${meal.image || ''}" alt="Plat du ${day}" class="w-full h-20 object-cover rounded mb-2">
          <p class="mt-1 text-sm font-semibold text-gray-800">${meal.nom}</p>
        </div>
      `;
    } else {
      summaryGrid.innerHTML += `
        <div class="border rounded-lg p-3 text-center opacity-40">
          <h5 class="font-bold text-green-700 capitalize">${day}</h5>
          <div class="w-full h-20 flex items-center justify-center bg-gray-100 rounded mb-2 text-gray-400">Aucun plat</div>
          <p class="mt-1 text-sm font-semibold text-gray-400">Non validé</p>
        </div>
      `;
    }
  });
}

function switchTab(tab) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  const target = document.getElementById(tab);
  if (target) target.classList.add('active');
}
// Affichage recette simple au clic
window.addEventListener('DOMContentLoaded', () => {
  fetch('100_plats.json')
    .then(response => response.json())
    .then(plats => {
      meals = plats.map(m => ({ ...m }));
      generateMealPlan();
      showDay(currentDay);

      // Ajoute ce bloc ICI pour que meals soit bien chargé
      document.querySelectorAll('#recette-carousel .recipe-card').forEach(card => {
        card.style.cursor = "pointer";
        card.addEventListener('click', function() {
          const title = this.querySelector('h5').textContent.trim();
          const plat = meals.find(m => m.nom === title);
          if (!plat) return;
          document.getElementById('simple-recipe-img').src = plat.image;
          document.getElementById('simple-recipe-img').alt = plat.nom;
          document.getElementById('simple-recipe-title').textContent = plat.nom;
          document.getElementById('simple-recipe-desc').textContent = plat.description || '';
          document.getElementById('simple-recipe-ings').innerHTML = (plat.ingredients || []).map(ing => `<li>${ing}</li>`).join('');
          document.getElementById('simple-recipe-time').innerHTML = `<i class="fas fa-clock mr-1"></i> ${plat.minute || '-'} min`;
          document.getElementById('simple-recipe-cal').innerHTML = `<i class="fas fa-fire mr-1"></i> ${plat.calories || '-'} kcal`;
          document.getElementById('simple-recipe-detail').classList.remove('hidden');
        });
      });
  });

  // Gestion menu mobile
  document.getElementById('mobileMenuBtn').addEventListener('click', () => {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
  });
});
function closeSimpleRecipe() {
  document.getElementById('simple-recipe-detail').classList.add('hidden');
}