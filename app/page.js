'use client'

import { useState, useEffect, useRef } from 'react'
import { Box, Stack, Typography, Button, Modal, TextField, Card, CardMedia, List, ListItem, ListItemText, Divider, Drawer, Radio, RadioGroup, FormControlLabel, FormControl } from '@mui/material'
import { firestore, storage } from '@/firebase'
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
} from 'firebase/firestore'
import { ref, getDownloadURL, uploadBytesResumable } from 'firebase/storage'

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
}

export default function Home() {
  const [inventory, setInventory] = useState([])
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [selectedItem, setSelectedItem] = useState('')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addMode, setAddMode] = useState('manual') // 'manual' or 'predefined'

  const itemRefs = useRef({})

  const itemImages = {
    broccoli: '/images/brocilli.jfif',
    carrot: '/images/carrot.jfif',
    cauliflower: '/images/cauli.jfif',
    chilli: '/images/chilli.jfif',
    cucumber: '/images/cucumber.jfif',
    green: '/images/green.jfif',
    onion: '/images/onion.jfif',
  }

  const defaultPrice = 2;

  const predefinedItems = Object.keys(itemImages)

  const updateInventory = async () => {
    try {
      const snapshot = query(collection(firestore, 'inventory'))
      const docs = await getDocs(snapshot)
      const inventoryList = []
      docs.forEach((doc) => {
        inventoryList.push({ name: doc.id, ...doc.data() })
      })
      setInventory(inventoryList)
    } catch (error) {
      console.error("Error fetching inventory: ", error)
    }
  }

  useEffect(() => {
    updateInventory()
  }, [])

  const handleImageUpload = async (item) => {
    if (!imageFile) return
    const storageRef = ref(storage, `inventory-images/${item}`)
    const uploadTask = uploadBytesResumable(storageRef, imageFile)
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Optional: track progress of the upload
      },
      (error) => {
        console.error('Error uploading image:', error)
      },
      async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
        await setDoc(doc(collection(firestore, 'inventory'), item), { imageUrl: downloadURL }, { merge: true })
        await updateInventory()
      }
    )
  }

  const addItem = async () => {
    if (!itemName) return
    try {
      const docRef = doc(collection(firestore, 'inventory'), itemName)
      const docSnap = await getDoc(docRef)

      const imageUrl = addMode === 'predefined' ? itemImages[itemName.toLowerCase()] : (imageFile ? await handleImageUpload(itemName) : '/images/default.jpg');

      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        await setDoc(docRef, { quantity: quantity + 1, price: defaultPrice, imageUrl }, { merge: true })
      } else {
        await setDoc(docRef, { quantity: 1, price: defaultPrice, imageUrl }, { merge: true })
      }

      setItemName('')
      setImageFile(null)
      await updateInventory()
    } catch (error) {
      console.error("Error adding item: ", error)
    }
  }

  const removeItem = async (item) => {
    if (!item) return
    try {
      const docRef = doc(collection(firestore, 'inventory'), item)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const { quantity } = docSnap.data()
        if (quantity === 1) {
          await deleteDoc(docRef)
        } else {
          await setDoc(docRef, { quantity: quantity - 1 })
        }
      }
      await updateInventory()
    } catch (error) {
      console.error("Error removing item: ", error)
    }
  }

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const handleItemClick = (name) => {
    setSelectedItem(name)
    itemRefs.current[name].scrollIntoView({ behavior: 'smooth', block: 'center' })
    setDrawerOpen(false)  // Close the drawer after an item is clicked
  }

  const toggleDrawer = (open) => () => {
    setDrawerOpen(open)
  }

  const filteredInventory = inventory.filter(({ name }) =>
    name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      flexDirection={'column'}
      sx={{
        backgroundImage: 'url(/images/pantry-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Heading */}
      <Box
        width="100%"
        bgcolor="rgba(0, 0, 0, 0.7)"
        p={3}
        display="flex"
        justifyContent="center"
      >
        <Typography variant="h3" color="white">
          Yash Pantry Store
        </Typography>
      </Box>

      <Box display="flex" height="100%" width="100%">
        {/* Left Sidebar - Inventory List as a Drawer */}
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
          sx={{
            '& .MuiDrawer-paper': { width: '240px' },
          }}
        >
          <Box
            bgcolor="rgba(255, 255, 255, 0.8)"
            p={2}
            display="flex"
            flexDirection="column"
            alignItems="center"
          >
            <Typography variant="h5" color="#333">
              Inventory List
            </Typography>
            <Divider sx={{ width: '100%', my: 2 }} />
            <List>
              {inventory.map(({ name, quantity, price = defaultPrice }) => (
                <ListItem button key={name} onClick={() => handleItemClick(name)}>
                  <ListItemText primary={`${name.charAt(0).toUpperCase() + name.slice(1)} (x${quantity})`} secondary={`$${price} each`} />
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>

        {/* Main Content */}
        <Box
          width="100%"
          display="flex"
          flexDirection="column"
          alignItems="center"
          gap={2}
          p={3}
        >
          <Button variant="outlined" onClick={toggleDrawer(!drawerOpen)}>
            {drawerOpen ? "Hide Inventory List" : "Show Inventory List"}
          </Button>
          <TextField
            label="Search Items"
            variant="outlined"
            fullWidth
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={style}>
              <Typography id="modal-modal-title" variant="h6" component="h2">
                Add Item
              </Typography>
              <FormControl component="fieldset">
                <RadioGroup
                  row
                  value={addMode}
                  onChange={(e) => setAddMode(e.target.value)}
                >
                  <FormControlLabel value="manual" control={<Radio />} label="Manual" />
                  <FormControlLabel value="predefined" control={<Radio />} label="Predefined" />
                </RadioGroup>
              </FormControl>
              {addMode === 'manual' ? (
                <>
                  <TextField
                    id="outlined-basic"
                    label="Item"
                    variant="outlined"
                    fullWidth
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                  >
                    Upload Image
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setImageFile(e.target.files[0])}
                    />
                  </Button>
                </>
              ) : (
                <TextField
                  id="outlined-basic"
                  label="Select Item"
                  variant="outlined"
                  select
                  fullWidth
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  SelectProps={{
                    native: true,
                  }}
                >
                  <option value=""></option>
                  {predefinedItems.map((item) => (
                    <option key={item} value={item}>
                      {item.charAt(0).toUpperCase() + item.slice(1)}
                    </option>
                  ))}
                </TextField>
              )}
              <Button
                variant="outlined"
                onClick={() => {
                  addItem()
                  handleClose()
                }}
              >
                Add
              </Button>
            </Box>
          </Modal>
          <Button variant="contained" onClick={handleOpen}>
            Add New Item
          </Button>
          <Box border={'1px solid #333'} width="100%">
            <Box
              width="100%"
              height="100px"
              bgcolor={'#ADD8E6'}
              display={'flex'}
              justifyContent={'center'}
              alignItems={'center'}
            >
              <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
                Inventory Items
              </Typography>
            </Box>
            <Stack width="100%" spacing={2} overflow={'auto'} p={3}>
              {filteredInventory.map(({ name, quantity, imageUrl, price = defaultPrice }) => (
                <Card
                  key={name}
                  ref={(el) => (itemRefs.current[name] = el)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: 2,
                    border: selectedItem === name ? '2px solid #1976d2' : 'none',
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <CardMedia
                      component="img"
                      height="100"
                      image={imageUrl || itemImages[name.toLowerCase()] || '/images/default.jpg'}
                      alt={`${name}`}
                    />
                    <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                      {name.charAt(0).toUpperCase() + name.slice(1)}
                    </Typography>
                  </Stack>
                  <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                    Quantity: {quantity}
                  </Typography>
                  <Typography variant={'h4'} color={'#333'} textAlign={'center'}>
                    Price: ${price} each
                  </Typography>
                  <Button variant="contained" onClick={() => removeItem(name)}>
                    Remove
                  </Button>
                </Card>
              ))}
            </Stack>
          </Box>

          {/* Footer */}
          <Box
            width="100%"
            bgcolor="#333"
            color="white"
            textAlign="center"
            padding={2}
            mt={5}
          >
            <Typography variant="h6">
              Happy Shopping!
            </Typography>
            <Typography variant="body1">
              Contact us: 206-377-3456
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
