import React, { useState, useEffect } from "react";
import {
  Box,
  FormControlLabel,
  Checkbox,
  Typography,
  Stack,
} from "@mui/material";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider, DateTimePicker } from "@mui/x-date-pickers";
import dayjs from "dayjs";

const DateTimeRangePicker = ({ startDate, endDate, onChange }) => {
  // Initialize with provided dates or defaults
  const [start, setStart] = useState(() => {
    if (startDate) {
      return startDate.includes("T")
        ? dayjs(startDate)
        : dayjs(startDate).startOf("day");
    }
    return dayjs().startOf("day");
  });

  const [end, setEnd] = useState(() => {
    if (endDate) {
      return endDate.includes("T")
        ? dayjs(endDate)
        : dayjs(endDate).endOf("day");
    }
    return dayjs().endOf("day");
  });

  const [useDefaultTimes, setUseDefaultTimes] = useState(true);

  useEffect(() => {
    if (startDate) {
      const newStart = startDate.includes("T")
        ? dayjs(startDate)
        : dayjs(startDate).startOf("day");
      setStart(newStart);
    }

    if (endDate) {
      const newEnd = endDate.includes("T")
        ? dayjs(endDate)
        : dayjs(endDate).endOf("day");
      setEnd(newEnd);
    }
  }, [startDate, endDate]);

  const handleStartDateTimeChange = (newDateTime) => {
    if (!newDateTime || !newDateTime.isValid()) return;

    // Use the exact date and time selected
    setStart(newDateTime);
    setUseDefaultTimes(false);

    // Format dates for the onChange handler - ensure we send non-midnight time
    const formattedStart = newDateTime.format("YYYY-MM-DDTHH:mm:ss");

    // Make sure end time is not midnight (to prevent backend conversion)
    let formattedEnd;
    if (useDefaultTimes || end.format("HH:mm:ss") === "00:00:00") {
      // If using default end time, make it 23:59:59
      const adjustedEnd = dayjs(end).hour(23).minute(59).second(59);
      formattedEnd = adjustedEnd.format("YYYY-MM-DDTHH:mm:ss");
    } else {
      formattedEnd = end.format("YYYY-MM-DDTHH:mm:ss");
    }

    onChange(formattedStart, formattedEnd);
  };

  const handleEndDateTimeChange = (newDateTime) => {
    if (!newDateTime || !newDateTime.isValid()) return;

    // Ensure end date is not before start date
    if (newDateTime.isBefore(start)) return;

    // Use the exact date and time selected
    setEnd(newDateTime);
    setUseDefaultTimes(false);

    // Format dates for the onChange handler
    const formattedStart = start.format("YYYY-MM-DDTHH:mm:ss");
    const formattedEnd = newDateTime.format("YYYY-MM-DDTHH:mm:ss");

    onChange(formattedStart, formattedEnd);
  };

  const handleDefaultTimesToggle = (event) => {
    const useDefaults = event.target.checked;
    setUseDefaultTimes(useDefaults);

    if (useDefaults) {
      // Set to default times (00:00 for start, 23:59:59 for end)
      const newStart = dayjs(start).startOf("day");
      const newEnd = dayjs(end).endOf("day");

      setStart(newStart);
      setEnd(newEnd);

      // Format dates - send date-only format to trigger backend defaults
      const formattedStart = newStart.format("YYYY-MM-DD");
      const formattedEnd = newEnd.format("YYYY-MM-DD");

      onChange(formattedStart, formattedEnd);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Stack
          spacing={2}
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          mb={1}
        >
          <DateTimePicker
            label="Start Date & Time"
            value={start}
            onChange={handleStartDateTimeChange}
            disableFuture
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
              },
            }}
            timeSteps={{ minutes: 1 }} // Ensure minute intervals are set to 1
            disabled={useDefaultTimes}
            ampm={false}
            format="YYYY-MM-DD HH:mm"
          />

          <Box sx={{ display: { xs: "none", sm: "block" } }}>to</Box>

          <DateTimePicker
            label="End Date & Time"
            value={end} // Corrected value prop to 'end'
            onChange={handleEndDateTimeChange}
            disableFuture
            slotProps={{
              textField: {
                size: "small",
                fullWidth: true,
              },
            }}
            timeSteps={{ minutes: 1 }} // Ensure minute intervals are set to 1
            disabled={useDefaultTimes}
            ampm={false}
            format="YYYY-MM-DD HH:mm"
          />
        </Stack>

        <Box pl={1}>
          <FormControlLabel
            control={
              <Checkbox
                checked={useDefaultTimes}
                onChange={handleDefaultTimesToggle}
                size="small"
              />
            }
            label={
              <Typography variant="body2" color="textSecondary">
                Use default times (00:00 - 23:59)
              </Typography>
            }
          />
        </Box>
      </Box>
    </LocalizationProvider>
  );
};

export default DateTimeRangePicker;
