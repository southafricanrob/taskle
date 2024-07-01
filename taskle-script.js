document.addEventListener('DOMContentLoaded', () => {
  // Initializing Sortable for each bucket
  ['task-pool', '2-minute-tasks', 'morning', 'afternoon', 'evening'].forEach(initSortable);

  // Add event listeners
  document.getElementById('all-done-btn').addEventListener('click', allDone);
  document.getElementById('all-done-btn').addEventListener('touchstart', allDone, { passive: false });
  document.getElementById('close-all-done').addEventListener('click', closeOverlay);
  document.getElementById('close-all-done').addEventListener('touchstart', closeOverlay, { passive: false });

  // Show help overlay if first visit
  if (!localStorage.getItem('visited')) {
    toggleHelpOverlay();
    localStorage.setItem('visited', 'true');
  }

  // Load tasks from local storage
  loadTasks();
  initializeViewState();

  // Apply initial view state from local storage
  const isEisenhowerView = localStorage.getItem('eisenhowerView') === 'true';
  if (isEisenhowerView) {
    document.querySelector('.right-column').classList.add('eisenhower');
  }
  updateBucketLabels(isEisenhowerView);
});

function initSortable(bucketId) {
  new Sortable(document.getElementById(bucketId), {
    group: 'shared',
    animation: 150,
    handle: '.task', // Only .task elements are draggable
    onStart: function(evt) {
      evt.item.dragging = false;
    },
    onMove: function(evt) {
      const threshold = 10;
      const distance = Math.sqrt(
        Math.pow(evt.originalEvent.clientX - evt.originalEvent.clientX, 2) +
        Math.pow(evt.originalEvent.clientY - evt.originalEvent.clientY, 2)
      );
      if (distance > threshold) {
        evt.item.dragging = true;
      }
    },
    onEnd: function(evt) {
      evt.item.dragging = false;
      saveTasks();
    }
  });
}

function createTask() {
  const taskInput = document.getElementById('new-task-input');
  const taskText = taskInput.value.trim();
  if (taskText === '') {
    alert("Task cannot be empty!");
    return;
  }

  const task = createTaskElement(taskText);
  document.getElementById('task-pool').appendChild(task);
  taskInput.value = '';
  saveTasks();
}

function createTaskElement(text) {
  const task = document.createElement('div');
  task.classList.add('task');
  task.textContent = text;
  task.setAttribute('draggable', true);
  task.addEventListener('click', toggleComplete);
  task.addEventListener('touchstart', handleTouchStart, { passive: false });
  task.addEventListener('touchmove', handleTouchMove, { passive: false });
  task.addEventListener('touchend', handleTouchEnd, { passive: false });

  const deleteIcon = document.createElement('i');
  deleteIcon.classList.add('fas', 'fa-trash-alt', 'delete-icon');
  deleteIcon.addEventListener('click', function(event) {
    event.stopPropagation();
    deleteTask(event.target.parentNode);
  });
  deleteIcon.addEventListener('touchstart', function(event) {
    event.stopPropagation();
    deleteTask(event.target.parentNode);
  }, { passive: false });

  task.appendChild(deleteIcon);
  return task;
}

function handleKeyPress(event) {
  if (event.key === 'Enter') {
    createTask();
  }
}

function toggleComplete(event) {
  const task = event.currentTarget;
  if (!task.dragging) {
    task.classList.toggle('completed');
    saveTasks();
  }
}

function handleTouchStart(event) {
  const task = event.currentTarget;
  task.touchStartX = event.touches[0].clientX;
  task.touchStartY = event.touches[0].clientY;
  task.touchStartTime = Date.now();
  task.dragging = false;
}

function handleTouchMove(event) {
  const task = event.currentTarget;
  const touchX = event.touches[0].clientX;
  const touchY = event.touches[0].clientY;

  const distance = Math.sqrt(
    Math.pow(touchX - task.touchStartX, 2) + Math.pow(touchY - task.touchStartY, 2)
  );

  const threshold = 10;
  if (distance > threshold) {
    task.dragging = true;
  }
}

function handleTouchEnd(event) {
  const task = event.currentTarget;
  const touchDuration = Date.now() - task.touchStartTime;
  if (!task.dragging && touchDuration < 200) {
    toggleComplete(event);
  }
}

function deleteTask(task) {
  task.parentNode.removeChild(task);
  saveTasks();
}

function allDone() {
  const completedTasks = document.querySelectorAll('.task.completed');
  completedTasksCount = completedTasks.length;

  if (completedTasksCount > 0) {
    showConfetti();
    showCompletionMessage();
    completedTasks.forEach(task => task.remove());
  }

  const tasks = document.querySelectorAll('.right-column .task:not(.completed)');
  tasks.forEach(task => {
    document.getElementById('task-pool').appendChild(task);
  });

  saveTasks();
}

function showCompletionMessage() {
  const quotes = [
    "The way to get started is to quit talking and begin doing.<span class='quoter'>Walt Disney</span>",
    "You don't have to be great to start, but you have to start to be great.<span class='quoter'>Zig Ziglar</span>",
    "The key to productivity is simplicity. Clear your mind of the unnecessary clutter, and focus on what truly matters.<span class='quoter'>Steve Jobs</span>",
    "Procrastination is the thief of time, collar him.<span class='quoter'>Charles Dickens</span>",
    "The future depends on what you do today.<span class='quoter'>Mahatma Gandhi</span>",
    "Don't watch the clock; do what it does. Keep going.<span class='quoter'>Sam Levenson</span>",
  ];

  const sendOff = [
    "Tasks slain, now go play!",
    "You're done, time for a beer!",
    "Mission complete, chill mode activated!",
    "Checklist cleared, relax and cheer!",
    "All done, time for fun!",
    "To-dos vanquished, off you go!",
    "Tasks conquered, now go chill!",
    "Done-zo! Time to disco!",
    "Boom! All done, go have fun!"
  ];

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
  const randomSendOff = sendOff[Math.floor(Math.random() * sendOff.length)];

  document.getElementById('completion-message').innerHTML = `
    Well done, you finished <strong>${completedTasksCount}</strong> tasks. 
    <br><br>Any uncompleted tasks have been moved back to the task pool and become
    <i>&nbsp;tomorrow's problem ;-)</i>
    <br><br><span class="quote">${randomQuote}</span><br>${randomSendOff}`;

  document.getElementById('completion-overlay').classList.add('active');
}

function saveTasks() {
  const buckets = ['task-pool', '2-minute-tasks', 'morning', 'afternoon', 'evening'];
  const tasksData = buckets.reduce((acc, bucketId) => {
    const bucketElem = document.getElementById(bucketId);
    const tasks = Array.from(bucketElem.children)
      .filter(child => !child.classList.contains('bucket-label')) // Exclude labels
      .map(task => {
        return { text: task.textContent.trim(), completed: task.classList.contains('completed') };
      });

    acc[bucketId] = tasks;
    return acc;
  }, {});

  localStorage.setItem('tasks', JSON.stringify(tasksData));
}

function loadTasks() {
  const tasksData = JSON.parse(localStorage.getItem('tasks')) || {};

  Object.entries(tasksData).forEach(([bucketId, tasks]) => {
    tasks.forEach(taskData => {
      const task = createTaskElement(taskData.text);
      if (taskData.completed) {
        task.classList.add('completed');
      }
      document.getElementById(bucketId).appendChild(task);
    });
  });
}

function closeOverlay() {
  document.getElementById('completion-overlay').classList.remove('active');
}

function toggleHelpOverlay() {
  document.getElementById('help-overlay').classList.toggle('active');
}

function showConfetti() {
  confetti({
    particleCount: 150,
    spread: 60
  });
}

function toggleEisenhower() {
  var containerDiv = document.querySelector('.right-column');
  var eveningBucket = document.getElementById('evening');

  var isEisenhowerView = containerDiv.classList.toggle('eisenhower');
  // Save the view state to local storage
  localStorage.setItem('eisenhowerView', isEisenhowerView);

  // Toggle evening bucket visibility
  if (isEisenhowerView) {
    eveningBucket.style.display = 'block';
  } else {
    eveningBucket.style.display = 'none';
  }

  updateBucketLabels(isEisenhowerView);
}

function updateBucketLabels(isEisenhowerView) {
  var buckets = {
    '2-minute-tasks': 'Do',
    'morning': 'Decide',
    'afternoon': 'Delegate',
    'evening': 'Delete'
  };

  for (var id in buckets) {
    var bucket = document.getElementById(id);
    if (bucket) {
      var label = bucket.querySelector('.bucket-label');
      if (label) {
        label.textContent = isEisenhowerView ? buckets[id] : id.replace('-', ' ');
      }
    }
  }
}
// Function to initialize view state based on localStorage

function initializeViewState() {

  var eisenhowerView = localStorage.getItem('eisenhowerView');

  if (eisenhowerView === 'true') {

    toggleEisenhower();

  }

}
