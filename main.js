// Wrap everything to catch potential early errors
try {
    document.addEventListener('DOMContentLoaded', () => {
        console.log("DOMContentLoaded started."); // Basic log

        // --- Firebase Instances ---
        if (!window.auth || !window.db) { console.error("CRITICAL: Firebase not initialized."); return; }
        const auth = window.auth;
        const db = window.db;
        // console.log("DEBUG: Firebase instances accessed.");

        // --- DOM Element References ---
        // console.log("DEBUG: Getting DOM elements...");
        const authSection = document.getElementById('auth-section');
        const appContainer = document.getElementById('app-container');
        const authEmailInput = document.getElementById('auth-email');
        const authPasswordInput = document.getElementById('auth-password');
        const signinButton = document.getElementById('signin-button'); // Check if found below
        const signupButton = document.getElementById('signup-button'); // Check if found below
        const signoutButton = document.getElementById('signout-button');
        const authErrorDiv = document.getElementById('auth-error');
        const userStatusDiv = document.getElementById('user-status');
        const userEmailSpan = document.getElementById('user-email');
        const homeTab = document.getElementById('home-tab');
        const reportingTab = document.getElementById('reporting-tab');
        const configureTab = document.getElementById('configure-tab');
        const homeSection = document.getElementById('home-section');
        const reportingSection = document.getElementById('reporting-section');
        const configureSection = document.getElementById('configure-section');
        const newTaskInput = document.getElementById('new-task-input');
        const taskPrioritySelect = document.getElementById('task-priority');
        const taskCategorySelect = document.getElementById('task-category');
        const addTaskButton = document.getElementById('add-task-button');
        const tasksContainer = document.getElementById('tasks-container');
        const completionPercentageSpan = document.getElementById('completion-percentage');
        const reportingContent = document.getElementById('reporting-content');
        const newCategoryInput = document.getElementById('new-category-input');
        const addCategoryButton = document.getElementById('add-category-button');
        const categoriesList = document.getElementById('categories-list');
        const sortTasksSelect = document.getElementById('sort-tasks');
        // console.log("DEBUG: Finished getting DOM elements.");

        // --- Application State ---
        let currentUser = null;
        let tasks = []; // Local cache of active tasks from Firestore
        let completedTasks = []; // Local cache of completed tasks from Firestore
        // Categories stored as objects { name: '...', color: '...' } in localStorage
        let categories = [
            { name: 'Personal', color: 'bg-gray-100' },
            { name: 'Work', color: 'bg-purple-100' }
        ];
        const defaultNewCategoryColor = { color: 'bg-blue-100' };
        const CATEGORIES_KEY = 'todoPwaCategories_v2'; // Key for localStorage
        let unsubscribeTasks = null; // Firestore listener handle

        // --- Authentication Logic ---
        const handleSignUp = () => {
            console.log("DEBUG: handleSignUp function entered!"); // <-- DEBUG LOG
            if (!authEmailInput || !authPasswordInput || !authErrorDiv) { console.error("Auth form elements missing in handleSignUp"); return; }
            const email = authEmailInput.value; const password = authPasswordInput.value; authErrorDiv.textContent = '';
            if (!email || !password) { authErrorDiv.textContent = 'Please enter email and password.'; return; }
            auth.createUserWithEmailAndPassword(email, password)
                .then((userCredential) => console.log("Signed up:", userCredential.user.uid))
                .catch((error) => { console.error("Sign up error:", error); authErrorDiv.textContent = error.message; });
        };
        const handleSignIn = () => {
            console.log("DEBUG: handleSignIn function entered!"); // <-- DEBUG LOG
            if (!authEmailInput || !authPasswordInput || !authErrorDiv) { console.error("Auth form elements missing in handleSignIn"); return; }
            const email = authEmailInput.value; const password = authPasswordInput.value; authErrorDiv.textContent = '';
            if (!email || !password) { authErrorDiv.textContent = 'Please enter email and password.'; return; }
            auth.signInWithEmailAndPassword(email, password)
                .then((userCredential) => console.log("Signed in:", userCredential.user.uid))
                .catch((error) => { console.error("Sign in error:", error); authErrorDiv.textContent = error.message; });
        };
        const handleSignOut = () => {
            console.log("DEBUG: handleSignOut function entered!"); // <-- DEBUG LOG
            auth.signOut().then(() => console.log("Signed out.")).catch((e) => console.error("Sign out error:", e));
        };

        // Listen for Authentication State Changes
        auth.onAuthStateChanged(user => {
             console.log("Auth state changed. User:", user ? user.uid : 'null');
             if (unsubscribeTasks) { unsubscribeTasks(); unsubscribeTasks = null; }
             tasks = []; completedTasks = []; currentUser = null; // Reset state

             if (user) { // User is signed in
                 currentUser = { uid: user.uid, email: user.email };
                 if(authSection) authSection.style.display = 'none';
                 if(appContainer) appContainer.style.display = 'block';
                 if(userStatusDiv) userStatusDiv.style.display = 'block';
                 if(userEmailSpan) userEmailSpan.textContent = user.email;
                 if(tasksContainer) tasksContainer.innerHTML = '<p class="text-gray-500 italic">Loading tasks...</p>';
                 if(completionPercentageSpan) completionPercentageSpan.textContent = '0%';
                 loadCategories(); renderCategories(); attachFirestoreListener();
             } else { // User is signed out
                 if(authSection) authSection.style.display = 'block';
                 if(appContainer) appContainer.style.display = 'none';
                 if(userStatusDiv) userStatusDiv.style.display = 'none';
                 if(authErrorDiv) authErrorDiv.textContent = '';
                 if(authEmailInput) authEmailInput.value = ''; if(authPasswordInput) authPasswordInput.value = '';
                 if(tasksContainer) tasksContainer.innerHTML = '<p class="text-gray-500 italic">Please log in.</p>';
                 if(completionPercentageSpan) completionPercentageSpan.textContent = '0%';
                 renderTasks(); // Render empty state
             }
        });


        // --- Firestore Listener ---
        function attachFirestoreListener() {
            if (!currentUser) return;
            console.log(`Attaching Firestore listener for user ${currentUser.uid}`);
            const tasksRef = db.collection('users').doc(currentUser.uid).collection('tasks')
                               .orderBy('createdAt', 'asc');
            unsubscribeTasks = tasksRef.onSnapshot(querySnapshot => {
                console.log("Firestore snapshot received.");
                tasks = []; completedTasks = [];
                querySnapshot.forEach(doc => {
                    const taskData = doc.data();
                    const task = {
                        id: doc.id, text: taskData.text || '', priority: taskData.priority || 'Medium', category: taskData.category || 'Uncategorized',
                        createdAt: taskData.createdAt?.toDate? taskData.createdAt.toDate() : new Date(),
                        completedAt: taskData.completedAt?.toDate? taskData.completedAt.toDate() : null,
                        parentId: taskData.parentId || null
                    };
                    if (task.completedAt) { completedTasks.push(task); } else { tasks.push(task); }
                });
                console.log("Local task cache updated from Firestore.");
                renderTasks(); // Re-render the UI with the fresh data
            }, error => {
                console.error("Error listening to Firestore:", error);
                if(tasksContainer) tasksContainer.innerHTML = '<p class="text-red-500 italic">Error loading tasks.</p>';
            });
        }

        // --- Category Data Handling ---
        function loadCategories() { try { const storedCategories = localStorage.getItem(CATEGORIES_KEY); if (storedCategories) { categories = JSON.parse(storedCategories); if (!Array.isArray(categories) || categories.some(c => typeof c !== 'object' || !c.name || !c.color)) { throw new Error("Invalid format"); } } else { categories = [ { name: 'Personal', color: 'bg-gray-100' }, { name: 'Work', color: 'bg-purple-100' } ]; saveCategories(); } } catch (e) { console.error("Error loading categories, using defaults:", e); categories = [ { name: 'Personal', color: 'bg-gray-100' }, { name: 'Work', color: 'bg-purple-100' } ]; } }
        function saveCategories() { try { localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories)); } catch (e) { console.error("Error saving categories:", e); } }

        // --- Rendering Functions ---
     function renderTasks() {
  if (!tasksContainer || !currentUser) {
    if (tasksContainer) tasksContainer.innerHTML = '<p>Please log in.</p>';
    return;
  }

  tasksContainer.innerHTML = '';
  const allActiveTasks = [...tasks];
  const sortBy = sortTasksSelect ? sortTasksSelect.value : 'default';
  const topLevelTasks = allActiveTasks.filter(task => !task.parentId);

  if (topLevelTasks.length === 0 && allActiveTasks.length === 0 && completedTasks.length === 0) {
    tasksContainer.innerHTML = '<p class="text-gray-500 italic">No tasks yet.</p>';
    updateCompletionPercentage();
    return;
  }

  const tasksByCategory = topLevelTasks.reduce((acc, task) => {
    const categoryName = task.category || 'Uncategorized';
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(task);
    return acc;
  }, {});

  const sortedCategoryNames = Object.keys(tasksByCategory).sort((a, b) => a.localeCompare(b));

  sortedCategoryNames.forEach(categoryName => {
    const categoryHeader = document.createElement('h3');
    categoryHeader.textContent = categoryName;
    categoryHeader.className = 'category-header';
    tasksContainer.appendChild(categoryHeader);

    const categoryTasks = sortTasksList(tasksByCategory[categoryName], sortBy);
    categoryTasks.forEach((task, index) => {
      renderSingleTask(task, 0, allActiveTasks, index);
    });
  });

  // ✅ Orphaned tasks logic goes here, AFTER the loop
  const orphanedTasks = allActiveTasks.filter(task => task.parentId && !findTaskById(task.parentId, false));
  if (orphanedTasks.length > 0) {
    const orphanHeader = document.createElement('h3');
    orphanHeader.textContent = "Orphaned Tasks";
    orphanHeader.className = 'category-header text-yellow-800 border-yellow-300';
    tasksContainer.appendChild(orphanHeader);

    sortTasksList(orphanedTasks, sortBy).forEach(task => renderSingleTask(task, 0, allActiveTasks));
  }

  updateCompletionPercentage();
}      

        function renderSingleTask(task, level, allActiveTasks, topLevelIndex = null) {
            if (!tasksContainer || !currentUser) return;
            const taskElement = createTaskElement(task); // Creates element relying on CSS classes
            if (level === 0 && topLevelIndex !== null) {
            taskElement.style.backgroundColor = (topLevelIndex % 2 === 0) ? '#ffffff' : '#f3f4f6'; // alternate colors
}
            if (level > 0) { taskElement.style.marginLeft = `${level * 2}rem`; }
            let isCompleted = completedTasks.some(ct => ct.id === task.id);
            if (isCompleted) { taskElement.classList.add('completed'); }
            tasksContainer.appendChild(taskElement);
            const children = allActiveTasks.filter(child => child.parentId === task.id);
            if (children.length > 0) { children.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)); children.forEach(child => renderSingleTask(child, level + 1, allActiveTasks)); }

            // Subtask input setup
            const subtaskInputDiv = document.createElement('div'); subtaskInputDiv.id = `subtask-input-${task.id}`; subtaskInputDiv.className = 'subtask-input-container'; subtaskInputDiv.style.display = 'none'; subtaskInputDiv.innerHTML = ` <input type="text" placeholder="Add subtask..." class="subtask-input flex-grow"/> <button class="add-subtask-confirm-btn bg-green-500 hover:bg-green-600">Add</button> <button class="add-subtask-cancel-btn bg-gray-400 hover:bg-gray-500">Cancel</button> `; taskElement.insertAdjacentElement('afterend', subtaskInputDiv);
            const input = subtaskInputDiv.querySelector('.subtask-input'); const confirmBtn = subtaskInputDiv.querySelector('.add-subtask-confirm-btn'); const cancelBtn = subtaskInputDiv.querySelector('.add-subtask-cancel-btn');
            confirmBtn.onclick = () => { if (input.value.trim()) { addSubtask(task.id, input.value.trim(), task.priority, task.category); input.value = ''; subtaskInputDiv.style.display = 'none'; } };
            input.onkeypress = (e) => { if (e.key === 'Enter' && input.value.trim()) { confirmBtn.onclick(); } };
            cancelBtn.onclick = () => { input.value = ''; subtaskInputDiv.style.display = 'none'; };
        }

        // Create HTML element for a single task (Relies on CSS @apply rules)
        function createTaskElement(task) {
            const div = document.createElement('div');
            div.dataset.taskId = task.id;
            div.className = 'task-item'; // Base class

            const categoryName = task.category || 'Uncategorized';
            const categoryObj = categories.find(c => c.name === categoryName);
            const bgColorClass = categoryObj?.color || 'bg-white';

            const detailsDiv = document.createElement('div');
            detailsDiv.className = 'task-details'; // Styled by CSS
            detailsDiv.classList.add(bgColorClass); // Apply category background class

            const taskTextSpan = document.createElement('span');
            taskTextSpan.textContent = task.text;
            console.log("Rendering task:", task);
            taskTextSpan.className = 'task-text'; // Styled by CSS

            // --- Priority Span ---

            const prioritySelect = document.createElement('select');
            ['High', 'Medium', 'Low'].forEach(level => {
               const option = document.createElement('option');
                  option.value = level;
                  option.textContent = level;
               if (level === task.priority) option.selected = true;
               prioritySelect.appendChild(option);
});

            function setPriorityColor(select, value) {
               switch (value) {
                 case 'High':
                    select.style.backgroundColor = '#FF0000'; // Bright red
                    break;
                 case 'Medium':
                    select.style.backgroundColor = '#FFA500'; // Bright orange
                    break;
                 case 'Low':
                    select.style.backgroundColor = '#FFFF00'; // Bright yellow
                    break;
                 default:
                    select.style.backgroundColor = 'transparent';
  }
}
setPriorityColor(prioritySelect, task.priority); // Initial color

prioritySelect.className = 'ml-2 text-sm border border-gray-300 rounded px-1';
prioritySelect.addEventListener('change', () => {
  updateTaskPriority(task.id, prioritySelect.value);
});
detailsDiv.appendChild(taskTextSpan)
detailsDiv.appendChild(prioritySelect);

            // --- Actions Div ---
            const actionsDiv = document.createElement('div');
            actionsDiv.className = 'task-actions'; // Styled by CSS

            const addSubtaskButton = document.createElement('button');
            addSubtaskButton.innerHTML = '&#43;'; // Plus sign entity
            addSubtaskButton.title = 'Add Subtask';
            addSubtaskButton.className = 'add-subtask-btn'; // Uses base + specific CSS rule

            const completeButton = document.createElement('button');
            completeButton.innerHTML = '&#10003;'; // Checkmark entity
            completeButton.title = 'Complete Task';
            completeButton.className = 'complete-btn'; // Uses base + specific CSS rule

            const deleteButton = document.createElement('button');
            deleteButton.innerHTML = '&#10005;'; // Cross mark entity
            deleteButton.title = 'Delete Task';
            deleteButton.className = 'delete-btn'; // Uses base + specific CSS rule

            // Add event listeners
            addSubtaskButton.onclick = (e) => { e.stopPropagation(); toggleSubtaskInput(task.id); };
            completeButton.onclick = () => completeTask(task.id);
            deleteButton.onclick = () => deleteTask(task.id);

            let isCompleted = completedTasks.some(ct => ct.id === task.id);
            if (!isCompleted) {
                actionsDiv.appendChild(addSubtaskButton);
                actionsDiv.appendChild(completeButton);
            }
            actionsDiv.appendChild(deleteButton);

            div.appendChild(detailsDiv);
            div.appendChild(actionsDiv);

             if (isCompleted) { div.classList.add('completed'); } // Add class for completed styling
            return div;
         }

         function toggleSubtaskInput(taskId) { /* Keep existing logic */ const inputDiv = document.getElementById(`subtask-input-${taskId}`); if (inputDiv) { document.querySelectorAll('.subtask-input-container').forEach(div => { if (div.id !== `subtask-input-${taskId}`) { div.style.display = 'none'; } }); const isVisible = inputDiv.style.display === 'block'; inputDiv.style.display = isVisible ? 'none' : 'block'; if (!isVisible) { inputDiv.querySelector('.subtask-input').focus(); } } else { console.error(`Subtask input container not found: subtask-input-${taskId}`); } }
        function renderCategories() { /* Keep existing logic */ if (!taskCategorySelect || !categoriesList) return; taskCategorySelect.innerHTML = ''; [...categories].sort((a, b) => a.name.localeCompare(b.name)).forEach(category => { const option = document.createElement('option'); option.value = category.name; option.textContent = category.name; taskCategorySelect.appendChild(option); }); if (categories.length === 0) { const option = document.createElement('option'); option.value = 'Uncategorized'; option.textContent = 'Uncategorized'; taskCategorySelect.appendChild(option); } categoriesList.innerHTML = ''; if (categories.length === 0) { categoriesList.innerHTML = '<p>No categories defined.</p>'; return; } [...categories].sort((a, b) => a.name.localeCompare(b.name)).forEach(category => { const catDiv = document.createElement('div'); catDiv.className = `flex justify-between items-center mb-1 p-2 rounded border border-gray-300`; const nameAndColorDiv = document.createElement('div'); nameAndColorDiv.className = 'flex items-center'; const colorSwatch = document.createElement('span'); colorSwatch.className = `inline-block w-4 h-4 rounded mr-2 ${category.color || 'bg-white'} border border-gray-400`; colorSwatch.title = category.color || 'Default Color'; const categoryNameSpan = document.createElement('span'); categoryNameSpan.textContent = category.name; categoryNameSpan.className = `font-medium`; nameAndColorDiv.appendChild(colorSwatch); nameAndColorDiv.appendChild(categoryNameSpan); const isDefault = ['Personal', 'Work'].includes(category.name); const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'Delete'; deleteBtn.className = 'text-xs p-1 ml-2 bg-red-500 hover:bg-red-600 text-white rounded flex-shrink-0'; if (isDefault) { deleteBtn.disabled = true; deleteBtn.title = "Cannot delete default category"; deleteBtn.classList.add('opacity-50', 'cursor-not-allowed'); } else { deleteBtn.onclick = () => deleteCategory(category.name); } catDiv.appendChild(nameAndColorDiv); catDiv.appendChild(deleteBtn); categoriesList.appendChild(catDiv); }); }
        function updateCompletionPercentage() { /* Keep existing logic */ if (!completionPercentageSpan || !currentUser) { if(completionPercentageSpan) completionPercentageSpan.textContent = '0%'; return; }; const allTasksToday = [...tasks, ...completedTasks].filter(task => isToday(task.createdAt) || (task.completedAt && isToday(task.completedAt))); const completedTodayCount = allTasksToday.filter(task => task.completedAt && isToday(task.completedAt)).length; const totalToday = allTasksToday.length; const percentage = totalToday === 0 ? 0 : Math.round((completedTodayCount / totalToday) * 100); completionPercentageSpan.textContent = `${percentage}%`; }
        function displayReporting() { /* Keep existing logic */ if (!reportingContent || !currentUser) { if(reportingContent) reportingContent.innerHTML = '<p>Log in</p>'; return; }; reportingContent.innerHTML = ''; const allTasksHistory = [...tasks, ...completedTasks]; if (allTasksHistory.length === 0) { reportingContent.innerHTML = '<p>No data</p>'; return; } const tasksByCompletedDate = {}; allTasksHistory.forEach(task => { if (task.completedAt && task.completedAt instanceof Date && !isNaN(task.completedAt)) { const dateKey = task.completedAt.toLocaleDateString(); if (!tasksByCompletedDate[dateKey]) { tasksByCompletedDate[dateKey] = { dateObj: task.completedAt, tasks: [] }; } tasksByCompletedDate[dateKey].tasks.push(task); } }); const sortedDates = Object.keys(tasksByCompletedDate).sort((a, b) => tasksByCompletedDate[b].dateObj - tasksByCompletedDate[a].dateObj); let reportsGenerated = 0; sortedDates.forEach(dateStr => { const dayData = tasksByCompletedDate[dateStr]; const dayTasks = dayData.tasks; const totalCompletedOnDay = dayTasks.length; if (totalCompletedOnDay > 0) { reportsGenerated++; const dayContainer = document.createElement('div'); dayContainer.className = 'mb-4 p-3 border rounded bg-gray-50'; const dayHeader = document.createElement('h3'); dayHeader.textContent = `${dateStr} - Completed: ${totalCompletedOnDay}`; dayHeader.className = 'text-lg font-semibold mb-2 text-gray-700'; dayContainer.appendChild(dayHeader); 

// Group by category
const tasksByCategory = dayTasks.reduce((acc, task) => {
  const category = task.category || 'Uncategorized';
  if (!acc[category]) acc[category] = [];
  acc[category].push(task);
  return acc;
}, {});

// Sort categories alphabetically
const sortedCategoryNames = Object.keys(tasksByCategory).sort((a, b) => a.localeCompare(b));

// Render each category block
sortedCategoryNames.forEach(category => {
  const categoryHeader = document.createElement('h4');
  categoryHeader.textContent = category;
  categoryHeader.className = 'text-md font-semibold mt-2 text-gray-600';
  dayContainer.appendChild(categoryHeader);

  const ul = document.createElement('ul');
  ul.className = 'list-disc pl-5 space-y-1 text-sm';

  // Sort by priority → then by time
  const priorityOrder = { High: 1, Medium: 2, Low: 3 };
  tasksByCategory[category]
    .sort((a, b) => {
      const aPriority = priorityOrder[a.priority] || 99;
      const bPriority = priorityOrder[b.priority] || 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.completedAt - b.completedAt;
    })
    .forEach(task => {
      const li = document.createElement('li');
      const timeString = task.completedAt.toLocaleTimeString();
      const subtaskIndicator = task.parentId ? '(Subtask) ' : '';
      li.textContent = `${subtaskIndicator}${task.text} [${task.priority || 'Medium'}] (Completed: ${timeString})`;
      ul.appendChild(li);
    });

  dayContainer.appendChild(ul);
});

reportingContent.appendChild(dayContainer); } }); if (reportsGenerated === 0) { reportingContent.innerHTML = '<p>No completed tasks</p>'; } }

        // --- Task Management Functions (Firestore) ---
        
function updateTaskPriority(taskId, newPriority) {
  if (!currentUser) { alert("Log in"); return; }

  // Optimistically update local state
  const task = findTaskById(taskId, true);
  if (task) {
    task.priority = newPriority;
    renderTasks();
  }

  // Update in Firestore
  const taskRef = db.collection('users').doc(currentUser.uid).collection('tasks').doc(taskId);
  taskRef.update({ priority: newPriority })
    .then(() => console.log(`Priority updated for ${taskId}: ${newPriority}`))
    .catch((e) => {
      console.error("Error updating priority:", e);
      alert("Failed to update priority.");
    });
}

function findTaskById(taskId, includeCompleted = false) { let task = tasks.find(t => t.id === taskId); if (!task && includeCompleted) { task = completedTasks.find(t => t.id === taskId); } return task; }
        
function getSubtasks(parentId, includeCompleted = false) { const activeSubtasks = tasks.filter(t => t.parentId === parentId); if (includeCompleted) { const completedSubtasks = completedTasks.filter(t => t.parentId === parentId); return [...activeSubtasks, ...completedSubtasks]; } return activeSubtasks; }
        
function addTask() { if (!currentUser) { alert("Log in"); return; } if (!newTaskInput || !taskPrioritySelect || !taskCategorySelect) return; const text = newTaskInput.value.trim(); if (text === '') { alert('Enter task'); newTaskInput.focus(); return; } const userId = currentUser.uid; const priority = taskPrioritySelect.value; const category = taskCategorySelect.value || 'Uncategorized'; const newTaskId = Date.now().toString(); const newTaskData = { text: text, priority: priority, category: category, createdAt: firebase.firestore.FieldValue.serverTimestamp(), completedAt: null, parentId: null }; const optimisticTask = { ...newTaskData, id: newTaskId, createdAt: new Date() }; tasks.push(optimisticTask); renderTasks(); const originalInputText = newTaskInput.value; newTaskInput.value = ''; const taskRef = db.collection('users').doc(userId).collection('tasks').doc(newTaskId); taskRef.set(newTaskData).then(() => console.log("Task added:", newTaskId)).catch((e) => { console.error("Error adding task:", e); alert("Error saving task."); tasks = tasks.filter(t => t.id !== newTaskId); newTaskInput.value = originalInputText; renderTasks(); }); }
        
function addSubtask(parentId, text, parentPriority, parentCategory) { if (!currentUser) { alert("Log in"); return; } if (!text) return; const userId = currentUser.uid; const newSubtaskId = Date.now().toString(); 

   const newSubtaskData = { 
      text: text, 
      priority: 'Medium', 
      category: parentCategory || 'Uncategorized', createdAt: firebase.firestore.FieldValue.serverTimestamp(), completedAt: null, parentId: parentId }; const optimisticSubtask = { ...newSubtaskData, id: newSubtaskId, createdAt: new Date() }; tasks.push(optimisticSubtask); renderTasks(); const taskRef = db.collection('users').doc(userId).collection('tasks').doc(newSubtaskId); taskRef.set(newSubtaskData).then(() => console.log("Subtask added:", newSubtaskId)).catch((e) => { console.error("Error adding subtask:", e); alert("Error saving subtask."); tasks = tasks.filter(t => t.id !== newSubtaskId); renderTasks(); }); }
        
function completeTask(taskId) { if (!currentUser) { alert("Log in"); return; } const userId = currentUser.uid; const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId); const taskIndex = tasks.findIndex(t => t.id === taskId); let originalTask = null; if(taskIndex > -1) { originalTask = { ...tasks[taskIndex] }; const taskToComplete = tasks.splice(taskIndex, 1)[0]; taskToComplete.completed = true; taskToComplete.completedAt = new Date(); completedTasks.push(taskToComplete); renderTasks(); if (taskToComplete.parentId) { checkAndCompleteParent(taskToComplete.parentId); } } else { console.warn(`Task ${taskId} not active locally.`); } taskRef.update({ completedAt: firebase.firestore.FieldValue.serverTimestamp() }).then(() => console.log("Task completed:", taskId)).catch((e) => { console.error("Error completing task:", e); alert("Error completing task."); if (originalTask && taskIndex > -1) { completedTasks = completedTasks.filter(t => t.id !== taskId); tasks.splice(taskIndex, 0, originalTask); renderTasks(); } }); }
        function checkAndCompleteParent(parentId) { console.log(`Checking parent ${parentId}`); const parentTask = findTaskById(parentId); if (!parentTask) { console.log("Parent not active."); return; } const allSubtasks = getSubtasks(parentId, true); const allSubtasksCompleted = allSubtasks.length > 0 && allSubtasks.every(sub => completedTasks.some(comp => comp.id === sub.id)); if (allSubtasksCompleted) { console.log(`Completing parent ${parentId}.`); completeTask(parentId); } else { console.log(`Subtasks not all complete for ${parentId}.`); } }
        async function deleteTask(taskId) { if (!currentUser) { alert("Log in"); return; } if (!confirm("Delete task & ALL subtasks?")) return; const userId = currentUser.uid; const taskRef = db.collection('users').doc(userId).collection('tasks').doc(taskId); const tasksToDeleteIds = [taskId]; const originalTasks = [...tasks]; const originalCompletedTasks = [...completedTasks]; let subtasks = getSubtasks(taskId, true); subtasks.forEach(sub => tasksToDeleteIds.push(sub.id)); tasks = tasks.filter(t => !tasksToDeleteIds.includes(t.id)); completedTasks = completedTasks.filter(t => !tasksToDeleteIds.includes(t.id)); renderTasks(); try { console.log(`Deleting task ${taskId} & subtasks...`); const subtaskQuery = db.collection('users').doc(userId).collection('tasks').where('parentId', '==', taskId); const subtaskSnapshot = await subtaskQuery.get(); const subtaskDeletePromises = []; subtaskSnapshot.forEach(doc => { console.log(`Deleting subtask ${doc.id}`); subtaskDeletePromises.push(deleteTask(doc.id)); }); await Promise.all(subtaskDeletePromises); console.log(`Subtasks for ${taskId} deleted. Deleting parent...`); await taskRef.delete(); console.log("Task deleted:", taskId); } catch (e) { console.error("Error deleting task:", e); alert("Error deleting task."); tasks = originalTasks; completedTasks = originalCompletedTasks; renderTasks(); } }

        // Sort function (More Robust)
        function sortTasksList(tasksToSort, sortBy) {
            if (!Array.isArray(tasksToSort)) { console.error("sortTasksList non-array input:", tasksToSort); return []; }
            const priorityOrder = { 'High': 1, 'Medium': 2, 'Low': 3 }; const defaultPriority = 99; const sorted = [...tasksToSort];
            try { switch (sortBy) { case 'priority-high': sorted.sort((a, b) => (priorityOrder[a?.priority] || defaultPriority) - (priorityOrder[b?.priority] || defaultPriority)); break; case 'priority-low': sorted.sort((a, b) => (priorityOrder[b?.priority] || defaultPriority) - (priorityOrder[a?.priority] || defaultPriority)); break; case 'name-asc': sorted.sort((a, b) => (a?.text ?? '').toString().localeCompare((b?.text ?? '').toString())); break; case 'name-desc': sorted.sort((a, b) => (b?.text ?? '').toString().localeCompare((a?.text ?? '').toString())); break; case 'default': default: sorted.sort((a, b) => (a?.createdAt instanceof Date ? a.createdAt.getTime() : 0) - (b?.createdAt instanceof Date ? b.createdAt.getTime() : 0)); break; } }
            catch (e) { console.error("CRITICAL ERROR during sortTasksList:", e); console.error("Data that caused sorting error:", tasksToSort); return tasksToSort; } return sorted;
        }

        // --- Category Management Functions ---
        function addCategory() { if (!newCategoryInput) return; const newCategoryName = newCategoryInput.value.trim(); if (newCategoryName === '') { alert('Enter category name'); newCategoryInput.focus(); return; } if (categories.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) { alert('Category name exists.'); return; } const newCategory = { name: newCategoryName, color: defaultNewCategoryColor.color }; categories.push(newCategory); newCategoryInput.value = ''; saveCategories(); renderCategories(); console.log("Category added", newCategory); }
        function deleteCategory(categoryNameToDelete) { const isDefault = ['Personal', 'Work'].includes(categoryNameToDelete); if (isDefault) { alert("Cannot delete default."); return; } if (!confirm(`Delete category "${categoryNameToDelete}"? Tasks using it become 'Uncategorized'.`)) { return; } categories = categories.filter(cat => cat.name !== categoryNameToDelete); if (currentUser) { const userId = currentUser.uid; const tasksRef = db.collection('users').doc(userId).collection('tasks'); tasksRef.where('category', '==', categoryNameToDelete).get().then(snapshot => { if (snapshot.empty) return; const batch = db.batch(); snapshot.forEach(doc => { batch.update(tasksRef.doc(doc.id), { category: 'Uncategorized' }); }); return batch.commit(); }).then(() => console.log("Tasks updated")).catch(error => { console.error("Error updating tasks:", error); alert("Error updating tasks."); }); } else { const updateLocal = (t) => { if (t.category === categoryNameToDelete) t.category = 'Uncategorized'; }; tasks.forEach(updateLocal); completedTasks.forEach(updateLocal); renderTasks(); } saveCategories(); renderCategories(); }

        // --- Navigation / Tab Switching ---
        function switchTab(activeTab) { if (homeSection) homeSection.classList.remove('active'); if (reportingSection) reportingSection.classList.remove('active'); if (configureSection) configureSection.classList.remove('active'); if (homeTab) homeTab.classList.remove('active'); if (reportingTab) reportingTab.classList.remove('active'); if (configureTab) configureTab.classList.remove('active'); switch(activeTab) { case 'home': if (homeSection) homeSection.classList.add('active'); if (homeTab) homeTab.classList.add('active'); renderTasks(); break; case 'reporting': if (reportingSection) reportingSection.classList.add('active'); if (reportingTab) reportingTab.classList.add('active'); displayReporting(); break; case 'configure': if (configureSection) configureSection.classList.add('active'); if (configureTab) configureTab.classList.add('active'); renderCategories(); break; default: if (homeSection) homeSection.classList.add('active'); if (homeTab) homeTab.classList.add('active'); renderTasks(); break; } }

        // --- Utility Functions ---
        function isToday(someDate) { if (!someDate || !(someDate instanceof Date) || isNaN(someDate)) return false; const today = new Date(); return someDate.getDate() === today.getDate() && someDate.getMonth() === today.getMonth() && someDate.getFullYear() === today.getFullYear(); }

        // --- Event Listeners ---
        console.log("Setting up event listeners...");
        if (signupButton) signupButton.addEventListener('click', handleSignUp); else console.error("signupButton missing!");
        if (signinButton) signinButton.addEventListener('click', handleSignIn); else console.error("signinButton missing!");
        if (signoutButton) signoutButton.addEventListener('click', handleSignOut); else console.error("signoutButton missing!");
        if (addTaskButton) addTaskButton.addEventListener('click', addTask); else console.error("addTaskButton missing!");
        if (addCategoryButton) addCategoryButton.addEventListener('click', addCategory); else console.error("addCategoryButton missing!");
        if (sortTasksSelect) sortTasksSelect.addEventListener('change', renderTasks); else console.error("sortTasksSelect missing!");
        if (newTaskInput) newTaskInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); addTask(); } }); else console.error("newTaskInput missing!");
        if (newCategoryInput) newCategoryInput.addEventListener('keypress', (event) => { if (event.key === 'Enter') { event.preventDefault(); addCategory(); } }); else console.error("newCategoryInput missing!");
        if (homeTab) homeTab.addEventListener('click', () => switchTab('home')); else console.error("homeTab missing!");
        if (reportingTab) reportingTab.addEventListener('click', () => switchTab('reporting')); else console.error("reportingTab missing!");
        if (configureTab) configureTab.addEventListener('click', () => switchTab('configure')); else console.error("configureTab missing!");
        console.log("Event listeners setup complete.");

        // --- Initialization ---
        console.log("App structure initialized. Waiting for auth state...");

        // --- PWA Service Worker with Update Banner ---
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('SW registered.', reg.scope);

      if (reg.waiting) {
        showUpdateBanner(reg);
      }

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            showUpdateBanner(reg);
          }
        });
      });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (refreshing) return;
        window.location.reload();
        refreshing = true;
      });
    }).catch(err => {
      console.warn('SW registration failed: ', err);
    });
  });
}

      // --- Popup Banner to Update App to Newest Version ---

function showUpdateBanner(registration) {
  const banner = document.createElement('div');
  banner.textContent = 'A new version is available.';
  banner.style.position = 'fixed';
  banner.style.bottom = '0';
  banner.style.left = '0';
  banner.style.right = '0';
  banner.style.backgroundColor = '#2563eb';
  banner.style.color = 'white';
  banner.style.padding = '0.75rem';
  banner.style.textAlign = 'center';
  banner.style.zIndex = '1000';

  const updateButton = document.createElement('button');
  updateButton.textContent = 'Tap to Update';
  updateButton.style.marginLeft = '1rem';
  updateButton.style.background = 'white';
  updateButton.style.color = '#2563eb';
  updateButton.style.border = 'none';
  updateButton.style.padding = '0.5rem 1rem';
  updateButton.style.borderRadius = '0.375rem';
  updateButton.style.cursor = 'pointer';

  updateButton.onclick = () => {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
  };

  banner.appendChild(updateButton);
  document.body.appendChild(banner);
}


    }); // End DOMContentLoaded
} catch (e) {
    console.error("CRITICAL ERROR in script:", e);
     document.body.innerHTML = '<p style="color: red; font-weight: bold;">A critical error occurred. Please check the console.</p>';
}
