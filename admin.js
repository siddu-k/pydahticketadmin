import { db, auth } from './firebaseConfig.js';
import { collection, getDocs, getDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js';

// Login functionality
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
  ticketList.innerHTML = ''; // Clear the previous list

  ticketSnapshot.forEach(doc => {
    const ticket = doc.data();
    const listItem = document.createElement('li');
    listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');

    // Process timestamp field
    let formattedTimestamp = 'No Timestamp';
    if (ticket.timestamp) {
      try {
        if (ticket.timestamp.seconds) {
          // Firestore Timestamp object
          formattedTimestamp = new Date(ticket.timestamp.seconds * 1000).toLocaleString();
        } else {
          // String-based timestamp
          const parsedDate = new Date(ticket.timestamp);
          if (!isNaN(parsedDate)) {
            formattedTimestamp = parsedDate.toLocaleString();
          }
        }
      } catch (error) {
        console.error('Error formatting timestamp:', error);
      }
    }

    // Create ticket details string
    listItem.textContent = `${ticket.name} - ${ticket.subject}`;
    const timestampSpan = document.createElement('span');
    timestampSpan.classList.add('badge', 'bg-secondary', 'text-white');
    timestampSpan.textContent = formattedTimestamp;

    // Add timestamp to list item
    listItem.appendChild(timestampSpan);

    // Set up event listener to show ticket details
    listItem.setAttribute('data-id', doc.id);
    listItem.addEventListener('click', () => showTicketDetails(doc.id));

    // Append the ticket to the list
    ticketList.appendChild(listItem);
  });
}

// Show ticket details
async function showTicketDetails(ticketId) {
  const ticketRef = doc(db, 'tickets', ticketId);
  const ticketDoc = await getDoc(ticketRef);
  const ticket = ticketDoc.data();

  document.getElementById('ticketSubject').textContent = ticket.subject || 'N/A';
  document.getElementById('ticketName').textContent = ticket.name || 'N/A';
  document.getElementById('ticketEmail').textContent = ticket.email || 'N/A';
  document.getElementById('ticketPhone').textContent = ticket.phone || 'N/A';
  document.getElementById('ticketPin').textContent = ticket.pin || 'N/A';
  document.getElementById('ticketProblem').textContent = ticket.problem || 'N/A';

  const statusDropdown = document.getElementById('ticketStatus');
  statusDropdown.value = ticket.status || 'On Hold';

  document.getElementById('ticketDetails').setAttribute('data-id', ticketId);
  document.getElementById('ticketDetails').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}

// Back button
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
    fetchTickets();
    document.getElementById('ticketDetails').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status.');
  }
});

// Delete ticket functionality
let ticketToDelete = null;

document.getElementById('deleteButton').addEventListener('click', () => {
  ticketToDelete = document.getElementById('ticketDetails').getAttribute('data-id');
  document.getElementById('deleteModal').style.display = 'flex';
});

document.getElementById('confirmDelete').addEventListener('click', async () => {
  if (ticketToDelete) {
    try {
      await deleteDoc(doc(db, 'tickets', ticketToDelete));
      alert('Ticket deleted successfully!');
      fetchTickets();
      document.getElementById('ticketDetails').style.display = 'none';
      document.getElementById('dashboard').style.display = 'block';
    } catch (error) {
      console.error('Error deleting ticket:', error);
      alert('Failed to delete ticket.');
    }
    ticketToDelete = null;
  }
  closeModal();
});

document.getElementById('cancelDelete').addEventListener('click', closeModal);

function closeModal() {
  document.getElementById('deleteModal').style.display = 'none';
}

// Function to generate PDF from ticket content
document.getElementById("downloadTicketButton").addEventListener("click", function () {
  const { jsPDF } = window.jspdf; // Destructure jsPDF from the library
  const doc = new jsPDF();

  // Get ticket details from the page
  const subject = document.getElementById("ticketSubject").innerText;
  const name = document.getElementById("ticketName").innerText;
  const email = document.getElementById("ticketEmail").innerText;
  const phone = document.getElementById("ticketPhone").innerText;
  const pin = document.getElementById("ticketPin").innerText;
  const problem = document.getElementById("ticketProblem").innerText;
  const status = document.getElementById("ticketStatus").value;

  // Set PDF content
  doc.text("Ticket Details", 10, 10);
  doc.text(`Subject: ${subject}`, 10, 20);
  doc.text(`Name: ${name}`, 10, 30);
  doc.text(`Email: ${email}`, 10, 40);
  doc.text(`Phone: ${phone}`, 10, 50);
  doc.text(`PIN: ${pin}`, 10, 60);
  doc.text(`Problem: ${problem}`, 10, 70);
  doc.text(`Status: ${status}`, 10, 80);

  // Download the PDF
  doc.save("ticket-details.pdf");
});
