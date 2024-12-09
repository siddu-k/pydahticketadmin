import { db, auth } from './firebaseConfig.js';
import { collection, getDocs, getDoc, doc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/9.17.2/firebase-firestore.js";
import { signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/9.17.2/firebase-auth.js';

// Utility to show and hide elements
function toggleVisibility(element, shouldShow) {
  element.style.display = shouldShow ? 'block' : 'none';
}

// Utility to show loading spinner
function setLoadingState(isLoading) {
  const spinner = document.getElementById('loadingSpinner');
  toggleVisibility(spinner, isLoading);
}

// Login functionality
document.getElementById('loginButton').addEventListener('click', async () => {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    await signInWithEmailAndPassword(auth, username, password);
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    fetchAllTickets(); // Default to fetching all tickets after login
  } catch (error) {
    alert('Invalid credentials!');
    console.error('Authentication error:', error.message);
  }
});

// Fetch and display tickets
async function fetchTickets(pinnedOnly = false) {
  setLoadingState(true);

  const ticketsCollection = collection(db, 'tickets');
  const ticketSnapshot = await getDocs(ticketsCollection);
  const ticketList = document.getElementById('ticketsList');
  const noTicketsPlaceholder = document.getElementById('noTicketsPlaceholder');

  ticketList.innerHTML = ''; // Clear previous list
  let hasTickets = false;

  // Create an array of tickets from the snapshot
  const ticketsArray = [];
  ticketSnapshot.forEach(doc => {
    const ticket = doc.data();
    ticketsArray.push({ ...ticket, id: doc.id });
  });

  // Sort tickets by timestamp in descending order (newest first)
  ticketsArray.sort((a, b) => b.timestamp?.seconds - a.timestamp?.seconds);

  // Display tickets based on sorted order
  ticketsArray.forEach(ticket => {
    if (!pinnedOnly || ticket.isPinned) {
      hasTickets = true;
      const listItem = createTicketListItem(ticket, ticket.id, ticket.isPinned);
      ticketList.appendChild(listItem);
    }
  });

  toggleVisibility(noTicketsPlaceholder, !hasTickets);
  setLoadingState(false);
}

// Fetch all tickets
function fetchAllTickets() {
  fetchTickets(false);
}

// Fetch pinned tickets
function fetchPinnedTickets() {
  fetchTickets(true);
}

// Create a ticket list item
function createTicketListItem(ticket, docId, isPinned) {
  const listItem = document.createElement('li');
  listItem.classList.add('ticket-item');
  
  const timestamp = ticket.timestamp?.seconds ? new Date(ticket.timestamp.seconds * 1000).toLocaleString() : 'No Timestamp';

  listItem.textContent = `${ticket.name} - ${ticket.subject}`;

  // Create pin icon and set initial class based on pin state
  const pinIcon = document.createElement('i');
  pinIcon.classList.add('fa', 'fa-thumbtack', 'pin-icon');
  pinIcon.classList.add(isPinned ? 'pinned' : 'unpinned');  // Add appropriate class based on pin state
  pinIcon.style.cursor = 'pointer';

  pinIcon.addEventListener('click', async (e) => {
    e.stopPropagation();
    await updateDoc(doc(db, 'tickets', docId), { isPinned: !isPinned });
    isPinned ? fetchPinnedTickets() : fetchAllTickets();
  });

  const timestampSpan = document.createElement('span');
  timestampSpan.classList.add('badge', 'bg-secondary', 'text-white', 'timestamp');
  timestampSpan.textContent = timestamp;

  listItem.append(pinIcon, timestampSpan);
  listItem.setAttribute('data-id', docId);
  listItem.addEventListener('click', () => showTicketDetails(docId));

  return listItem;
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

  // Set ticket ID as a data attribute for status updates
  document.getElementById('ticketDetails').setAttribute('data-id', ticketId);

  document.getElementById('ticketDetails').style.display = 'block';
  document.getElementById('dashboard').style.display = 'none';
}

// Back button logic
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
    fetchAllTickets();
    document.getElementById('ticketDetails').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
  } catch (error) {
    console.error('Error updating status:', error);
    alert('Failed to update status.');
  }
});

// Event listeners for filtering tickets
document.getElementById('showPinnedButton').addEventListener('click', fetchPinnedTickets);
document.getElementById('showAllTicketsButton').addEventListener('click', fetchAllTickets);

// Set default visibility
toggleVisibility(document.getElementById('dashboard'), false);

// Filter tickets by PIN
document.getElementById('searchPinInput').addEventListener('input', async (event) => {
  const searchValue = event.target.value.trim(); // Get the entered PIN
  const ticketsCollection = collection(db, 'tickets');
  const ticketSnapshot = await getDocs(ticketsCollection);
  const ticketList = document.getElementById('ticketsList');
  const noTicketsPlaceholder = document.getElementById('noTicketsPlaceholder');

  ticketList.innerHTML = ''; // Clear previous list
  let hasTickets = false;

  ticketSnapshot.forEach(doc => {
    const ticket = doc.data();
    if (ticket.pin && ticket.pin.toLowerCase().includes(searchValue.toLowerCase())) {
      hasTickets = true;
      const listItem = createTicketListItem(ticket, doc.id, ticket.isPinned);
      ticketList.appendChild(listItem);
    }
  });

  toggleVisibility(noTicketsPlaceholder, !hasTickets); // Show placeholder if no tickets
});

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

// Mail popup handling
const mailButton = document.getElementById("mailButton");
const iframePopup = document.getElementById("iframePopup");
const closePopup = document.getElementById("closePopup");

// Show the popup when the mail button is clicked
mailButton.addEventListener("click", () => {
  iframePopup.style.display = "flex";
});

// Close the popup when the close button is clicked
closePopup.addEventListener("click", () => {
  iframePopup.style.display = "none";
});

// Close the popup when clicking outside the content
window.addEventListener("click", (e) => {
  if (e.target === iframePopup) {
    iframePopup.style.display = "none";
  }
});

// Copy email to clipboard
document.getElementById("copyEmailButton").addEventListener("click", () => {
  const email = document.getElementById("ticketEmail").textContent;
  navigator.clipboard.writeText(email).then(() => {
    alert("Email copied to clipboard!");
  }).catch((err) => {
    alert("Failed to copy email: " + err);
  });
});
