import { db, auth } from './firebaseConfig.js';
import { collection, getDocs, getDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js';

// Login functionality using Firebase Auth
document.getElementById('loginButton').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    // Firebase authentication
    await signInWithEmailAndPassword(auth, username, password);

    // If login is successful, hide login form and show dashboard
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    fetchTickets(); // Fetch tickets from Firestore
  } catch (error) {
    alert('Invalid credentials!');
    console.error('Authentication error:', error.message);
  }
});

// Fetch tickets from Firestore
async function fetchTickets() {
  const ticketsCollection = collection(db, 'tickets');
  const ticketSnapshot = await getDocs(ticketsCollection);
  const ticketList = document.getElementById('ticketsList');
  ticketList.innerHTML = ''; // Clear previous list

  ticketSnapshot.forEach(doc => {
    const ticket = doc.data();
    const listItem = document.createElement('li');
    listItem.textContent = `${ticket.name} - ${ticket.subject}`; // Display subject
    listItem.setAttribute('data-id', doc.id);
    listItem.addEventListener('click', () => showTicketDetails(doc.id));
    ticketList.appendChild(listItem);
  });
}

// Show ticket details when a ticket is clicked
async function showTicketDetails(ticketId) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const ticketDoc = await getDoc(ticketRef);
  const ticket = ticketDoc.data(); // Accessing ticket data

  document.getElementById('ticketSubject').textContent = ticket.subject;
  document.getElementById('ticketName').textContent = ticket.name;
  document.getElementById('ticketEmail').textContent = ticket.email;
  document.getElementById('ticketPhone').textContent = ticket.phone;
  document.getElementById('ticketPin').textContent = ticket.pin;
  document.getElementById('ticketProblem').textContent = ticket.problem;

  // Populate status dropdown
  const statusDropdown = document.getElementById('ticketStatus');
  statusDropdown.value = ticket.status || "On Hold"; // Default to "On Hold" if no status exists

  document.getElementById('ticketDetails').setAttribute('data-id', ticketId);
  document.getElementById('ticketDetails').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}

// Back button to return to the dashboard
document.getElementById('backButton').addEventListener('click', () => {
  document.getElementById('ticketDetails').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
});

// Update ticket status
document.getElementById('updateStatusButton').addEventListener('click', async () => {
  const ticketId = document.getElementById('ticketDetails').getAttribute('data-id');
  const newStatus = document.getElementById('ticketStatus').value;

  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    await updateDoc(ticketRef, { status: newStatus });
    alert('Status updated successfully!');
    fetchTickets(); // Refresh ticket list
    document.getElementById('ticketDetails').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status.');
  }
});

// Delete ticket functionality

let ticketToDelete = null; // Store the ticket ID to delete

// Show the modal when delete button is clicked
document.getElementById('deleteButton').addEventListener('click', () => {
  ticketToDelete = document.getElementById('ticketDetails').getAttribute('data-id');
  document.getElementById('deleteModal').style.display = 'flex';
});

// Handle confirm delete action
document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (ticketToDelete) {
    try {
      await deleteDoc(doc(db, 'tickets', ticketToDelete));
      alert('Ticket deleted successfully!');
      fetchTickets(); // Refresh ticket list
      document.getElementById('ticketDetails').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket.');
    }
    ticketToDelete = null; // Clear the stored ticket ID
  }
  closeModal();
});

// Handle cancel delete action
document.getElementById('cancelDelete').addEventListener('click', closeModal);

// Close the modal
function closeModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

