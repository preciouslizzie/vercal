import React from 'react';
import { MdOutlineCancel } from 'react-icons/md';
import { Button } from '.';
import { useStateContext } from '../contexts/ContextProvider';

const Notification = () => {
  const {
    currentColor,
    notifications,
    setIsClicked,
  } = useStateContext();

  return (
    <div className="nav-item absolute right-5 md:right-40 top-16 bg-white dark:bg-[#42464D] p-8 rounded-lg w-96 shadow-lg">
      <div className="flex justify-between items-center">
        <div className="flex gap-3">
          <p className="font-semibold text-lg">Notifications</p>
          {notifications.length > 0 && (
            <span className="text-white text-xs rounded px-2 py-1 bg-orange-theme">
              {notifications.length} New
            </span>
          )}
        </div>

        <Button
          icon={<MdOutlineCancel />}
          color="gray"
          borderRadius="50%"
          size="2xl"
          onClick={() => setIsClicked({})}
        />
      </div>

      <div className="mt-5">
        {notifications.length === 0 ? (
          <p className="text-gray-500 text-center">No notifications</p>
        ) : (
          notifications.map((item) => (
            <div
              key={item.id}
              className="flex flex-col border-b border-color p-3"
            >
              <p className="font-semibold">{item.title}</p>
              <p className="text-gray-500 text-sm">{item.message}</p>
            </div>
          ))
        )}

        <div className="mt-5">
          <Button
            color="white"
            bgColor={currentColor}
            text="See all notifications"
            borderRadius="10px"
            width="full"
          />
        </div>
      </div>
    </div>
  );
};

export default Notification;
